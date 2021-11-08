import { Injectable } from '@angular/core';
import { __clientID__, __clientSecret__, __redirectURI__ } from '../secrets';

@Injectable({
  providedIn: 'root'
})
export class SpotifyApiService {

  private repeatingState = [
    'off', 'context', 'track'
  ];

  constructor() { }

  async getAccessToken(code) {
    const result = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(__clientID__ + ':' + __clientSecret__)
      },
      body: `grant_type=authorization_code&code=${code}&redirect_uri=${__redirectURI__}`
    });

    const data = await result.json();

    return { refresh_token: data.refresh_token, access_token: data.access_token };
    ;
  }

  async refreshAccessToken(refresh_token) {
    const result = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(__clientID__ + ':' + __clientSecret__),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=refresh_token&refresh_token=${refresh_token}`
    });

    const data = await result.json();

    return data.access_token;
  }

  async setRepeatMode(access_token, repeatingIndex) {
    const result = await fetch(`https://api.spotify.com/v1/me/player/repeat?state=${this.repeatingState[repeatingIndex]}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token
      }
    });
  }

  async shuffleMusic(access_token, isShuffling) {
    const result = await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${isShuffling}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token,
      },
    });
  }

  async playSong(access_token, device_id?) {
    let query;

    (device_id) ? query = `?device_id=${device_id}` : query = '';

    const result = await fetch(`https://api.spotify.com/v1/me/player/play${query}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token
      }
    });
  }

  async pauseSong(access_token) {
    const result = await fetch('https://api.spotify.com/v1/me/player/pause', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token
      }
    });
  }

  async nextSong(access_token) {
    const result = await fetch('https://api.spotify.com/v1/me/player/next', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token
      }
    });
  }

  async previousSong(access_token) {
    const result = await fetch('https://api.spotify.com/v1/me/player/previous', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token
      }
    });
  }

  async getCurrentSongInfo(access_token) {
    const result = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token,
      },
    });

    const data = await result.json();

    console.log(data);

    return { songName: data.item.name, songID: data.item.id, image: data.item.album.images[0], artists: data.item.artists }
  }

  async getCurrentSongName(access_token) {
    const result = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token,
      },
    });

    const data = await result.json();

    return data.item.name;
  }

  async getSpotifyUserInfo(access_token) {
    const result = await fetch('https://api.spotify.com/v1/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token
      }
    });

    const data = await result.json();

    const userInfo = {
      display_name: data.display_name,
      id: data.id,
      profile_picture_URL: data.images[0].url,
      followers: data.followers.total
    };

    return userInfo;
  }

  async getSpotifyUserPlaylists(access_token, id, offset?) {
    // const result = await fetch('https://api.spotify.com/v1/me/playlists?' + new URLSearchParams({
    //   limit: '50',
    //   offset: (offset) ? offset : '0' // if offset exists, put in an offset, otherwise make it 0
    // }), {
    //   method: 'GET',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': 'Bearer ' + this.access_token,
    //   }
    // });

    const result = await fetch(`https://api.spotify.com/v1/users/${id}/playlists?` + new URLSearchParams({
      limit: '50',
      offset: (offset) ? offset : '0' // if offset exists, put in an offset, otherwise make it 0
    }), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token,
      }
    });

    const data = await result.json();

    return data;
  }

  async unfollowPlaylist(access_token: string, id: string) {
    const result = await fetch(`https://api.spotify.com/v1/playlists/${id}/followers`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token,
      }
    });

    console.log('playlist unfollowed');
  }

  async followPlaylist(access_token: string, id: string) {
    const result = await fetch(`https://api.spotify.com/v1/playlists/${id}/followers`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token,
      }
    });


    console.log('playlist followed');
  }

  async playSongsFromPlaylist(access_token, uris, device_id?) {
    let query;

    (device_id) ? query = `?device_id=${device_id}` : query = '';

    const result = await fetch(`https://api.spotify.com/v1/me/player/play${query}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token,
      },
      body: JSON.stringify({ uris: uris })
    });
  }

  async getTracks(access_token, tracksURL, offset?) {
    const result = await fetch(`${tracksURL}?` + new URLSearchParams({
      limit: '100',
      offset: (offset) ? offset : '0' // if offset exists, put in an offset, otherwise make it 0
    }), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token
      }
    });

    const data = await result.json();

    return data;
  }

  async transferPlayback(access_token, device_id) {
    const result = fetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token,
      },
      body: JSON.stringify({ device_ids: [`${device_id}`], play: 'false' })
    })
  }


}
