import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root'
})
export class UserCookieService {

  constructor(private cookieService: CookieService) { }

  setCookie(cookieName: string, cookie: string) {
    this.cookieService.set(cookieName, cookie);
  }

  getCookie(cookieName: string) {
    return this.cookieService.get(cookieName);
  }

  deleteCookie(cookieName: string) {
    this.cookieService.delete(cookieName);
  }

  deleteAll() {
    this.cookieService.deleteAll();
  }

  getAll() {
    return this.cookieService.getAll();
  }
}
