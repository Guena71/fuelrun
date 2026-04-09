var CLIENT_ID=import.meta.env.VITE_STRAVA_CLIENT_ID||"";
var REDIRECT_URI="https://fuelrun-9ibg.vercel.app/strava-callback";

// Build the Strava OAuth authorization URL
export function stravaAuthUrl(){
  var params=new URLSearchParams({
    client_id:CLIENT_ID,
    redirect_uri:REDIRECT_URI,
    response_type:"code",
    approval_prompt:"auto",
    scope:"activity:read_all",
  });
  return "https://www.strava.com/oauth/authorize?"+params.toString();
}

// Exchange auth code or refresh token via our server-side API
export async function stravaExchange(payload){
  var res=await fetch("/api/strava-token",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(Object.assign({redirect_uri:REDIRECT_URI},payload)),
  });
  var data=await res.json();
  if(!res.ok)throw new Error(data.message||data.error||JSON.stringify(data));
  return data;
}

// Refresh an expired access token
export async function stravaRefresh(refreshToken){
  return stravaExchange({grant_type:"refresh_token",refresh_token:refreshToken});
}

// Fetch the last N runs from Strava (after refreshing token if needed)
export async function fetchStravaRuns(stravaProfile,onTokenRefreshed){
  var token=stravaProfile.accessToken;
  // Refresh if expired (with 60s margin)
  if(Date.now()/1000>stravaProfile.expiresAt-60){
    var refreshed=await stravaRefresh(stravaProfile.refreshToken);
    token=refreshed.access_token;
    onTokenRefreshed&&onTokenRefreshed({
      accessToken:refreshed.access_token,
      refreshToken:refreshed.refresh_token,
      expiresAt:refreshed.expires_at,
      athleteId:stravaProfile.athleteId,
    });
  }
  // Get activities from the last 90 days
  var after=Math.floor((Date.now()-90*24*3600*1000)/1000);
  var res=await fetch(
    "https://www.strava.com/api/v3/athlete/activities?after="+after+"&per_page=50&page=1",
    {headers:{Authorization:"Bearer "+token}}
  );
  if(!res.ok)throw new Error("Strava API error "+res.status);
  var acts=await res.json();
  // Filter runs only
  return acts.filter(function(a){return a.type==="Run"||a.sport_type==="Run";});
}

// Convert a Strava activity to a journal entry
export function stravaActivityToEntry(act){
  var km=(act.distance/1000).toFixed(2);
  var min=Math.round(act.moving_time/60);
  return {
    done:true,
    km:km,
    min:String(min),
    feel:null,
    rpe:null,
    note:"[Strava] "+act.name,
    track:null,
    stravaId:act.id,
  };
}

// Convert array of Strava activities to entries map { dateString: entry }
export function stravaActivitiesToEntries(activities){
  var map={};
  activities.forEach(function(act){
    var d=new Date(act.start_date_local||act.start_date);
    var key=d.toDateString();
    // Don't overwrite a manually entered entry that has richer data
    map[key]=stravaActivityToEntry(act);
  });
  return map;
}