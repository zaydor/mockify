import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { ActivatedRoute, Router } from '@angular/router';
import { child, get, getDatabase, ref, update } from 'firebase/database';
import { __clientID__, __clientSecret__, __redirectURI__ } from '../secrets';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private access_token: string | void;
  private refresh_token: string;
  private uid: string;

  public spotifyUser: {
    display_name: string,
    id: string,
    followers: number,
    profile_picture_URL: string,
  };

  constructor(private route: ActivatedRoute, private router: Router, private auth: AngularFireAuth, private database: AngularFireDatabase) {
  }

  ngOnInit(): void {
    this.auth.onAuthStateChanged(async (user) => {
      if (user !== null) {
        console.log(user.uid);

        // TODO: check to see if refresh token exists in database
        this.uid = user.uid;
        const dbRef = await ref(getDatabase());

        get(child(dbRef, `users/${user.uid}/token`)).then(async (snapshot) => {
          if (snapshot.exists() && snapshot.val() !== '') { // refresh token exists
            console.log('snapshot val: ' + snapshot.val());
            this.refresh_token = snapshot.val();

            this.access_token = await this.refreshAccessToken(this.refresh_token);

            this.getSpotifyUserInfo();

          } else { // refresh token does not exist
            if (this.route.snapshot.firstChild === null) { // TODO: if it does not exist and firstChild is not valid, go back to home
              console.log('error with url');
              this.router.navigate(['/home']);
            } else {
              const code = this.route.snapshot.firstChild.url[0].path;
              console.log(code);

              await this.getAccessToken(code, user.uid); // gets access token and stores refresh token in db
              // now that we have a refresh token in db, we can use it to get a new access token (stored in memory) and use the api
              // 1) navigate to /profile
              this.router.navigate(['/profile']);
            }
          }

          // 2) check if refresh token exists
          // 3) generate a new access token
          // 4) load up the rest of the profile page with spotify stuff


        })
      }
    });
  }

  setUpProfilePage() {

  }

  async getSpotifyUserInfo() {
    const result = await fetch('https://api.spotify.com/v1/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.access_token
      }
    });

    const data = await result.json();

    console.log(data);

    this.spotifyUser = {
      display_name: await data.display_name,
      id: await data.id,
      profile_picture_URL: await data.images[0].url,
      followers: await data.followers.total
    }

    console.log(this.spotifyUser);
  }

  async getSpotifyUserPlaylists() {

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

    console.log('new access token: ' + data.access_token);

    return data.access_token;

    // we have a new access token to use now
  }

  async getAccessToken(code, uid): Promise<string | void> {
    await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(__clientID__ + ':' + __clientSecret__)
      },
      body: `grant_type=authorization_code&code=${code}&redirect_uri=${__redirectURI__}`
    }).then(async (result) => {
      const data = await result.json();

      console.log(data);

      const updates = {};
      updates[`users/${uid}/token`] = data.refresh_token;

      update(ref(getDatabase()), updates);


      return data.access_token;
    });


  }

}
