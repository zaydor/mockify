import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { UserCookieService } from '../services/user-cookie.service';

@Component({
  selector: 'app-spotify-authorization',
  templateUrl: './spotify-authorization.component.html',
  styleUrls: ['./spotify-authorization.component.css']
})
export class SpotifyAuthorizationComponent implements OnInit {

  private _userCookieService: UserCookieService = new UserCookieService(this.cookieService);

  constructor(private route: ActivatedRoute, private cookieService: CookieService) {
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      // if authorized, params = { code: 'code to be used for Access token', state: 'value to be checked for a valid request'}
      // if NOT authorized, params = { error: 'reason authorization failed', state: 'value to be checked for a valid request'}
      console.log('params: ' + params.get('state'));
      this.compareStates(params.get('state'));
    });
  }

  async compareStates(stateValueFromCookie) {
    const stateCookie = await this._userCookieService.getCookie('state');

    console.log('state cookie: ' + stateCookie);
    // compare param state with state cookie
    if (stateValueFromCookie === stateCookie) {
      console.log('states are the same!');
      // okay to get access token and continue auth flow
    } else {
      console.log('states are NOT the same!!');
      // reject request and throw an error
    }
  };

}
