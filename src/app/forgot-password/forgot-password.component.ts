import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { User } from '../user';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {

  public form: User = new User('', '', '', '');
  private myAuth;

  constructor(private auth: AngularFireAuth, private router: Router) {
    this.myAuth = getAuth();
  }

  ngOnInit(): void {
  }

  resetPassword() {
    sendPasswordResetEmail(this.myAuth, this.form.email)
      .then(() => {
        console.log('password reset sent');
      })
      .catch((e) => {
        const errorMessage = e.message;
        console.log(errorMessage);
      })

    document.getElementById('confirmation').style.visibility = 'visible';

  }

}
