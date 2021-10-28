import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, child, get, update } from 'firebase/database';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { __clientID__, __clientSecret__, __redirectURI__ } from '../secrets';


// TODO: This component is not really needed anymore,
// I could streamline the process and redirect straight to profile instead

@Component({
  selector: 'app-spotify-authorization',
  templateUrl: './spotify-authorization.component.html',
  styleUrls: ['./spotify-authorization.component.css']
})
export class SpotifyAuthorizationComponent implements OnInit {
  public myAuth;

  constructor(private auth: AngularFireAuth, private database: AngularFireDatabase, private route: ActivatedRoute, private router: Router) {
    this.myAuth = getAuth();

    try {
      this.auth.onAuthStateChanged((user) => {
        if (user !== null) {
          console.log(user.uid);
          this.route.queryParamMap.subscribe(async (params) => {
            // if authorized, params = { code: 'code to be used for Access token', state: 'value to be checked for a valid request'}
            // if NOT authorized, params = { error: 'reason authorization failed', state: 'value to be checked for a valid request'}
            if (params.get('error')) return; // TODO: Add an error page to redirect to


            console.log('params: ' + params.get('state'));

            if (this.compareStates(params.get('state'), user.uid)) {
              console.log('continuing authorization flow..');
              const code = params.get('code');

              this.router.navigate(['profile/', code]);
              // allegedly have access token here, ready to redirect and use it!!



            } else {
              console.log('There was an error with the states');
            }
          });
        } else {
          console.log('user is null');
        }
      });
    } catch (e) {

      console.log('no user should be signed in');

    }
  }

  ngOnInit(): void {
  }

  async compareStates(stateValueFromURL, uid): Promise<boolean | void> {
    const dbRef = await ref(getDatabase());

    get(child(dbRef, `users/${uid}/state`)).then((snapshot) => {
      if (snapshot.exists()) {
        const memoryState = snapshot.val();

        console.log('memory state: ' + memoryState);
        // compare param state with state cookie
        if (stateValueFromURL === memoryState) {
          console.log('states are the same!');
          // okay to get access token and continue auth flow
          return true;
        } else {
          console.log('states are NOT the same!!');
          // reject request and throw an error
          return false;
        }
      } else {
        console.log("No data available");
        return false;
      }
    }).catch((error) => {
      console.error(error);
      return false;
    });
  };
}

