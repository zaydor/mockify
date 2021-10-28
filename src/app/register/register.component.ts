import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase, AngularFireList } from '@angular/fire/compat/database';
import { Auth, createUserWithEmailAndPassword, deleteUser, getAuth, updateProfile } from 'firebase/auth';
import { Observable } from 'rxjs';
import { User } from '../user';
import { RealtimeDatabaseService } from '../services/realtime-database.service';
import { getDatabase, ref, runTransaction, set } from 'firebase/database';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  public form: User = new User('', '', '', '');
  public myAuth: Auth;
  private _realtimeDatabase: RealtimeDatabaseService = new RealtimeDatabaseService(this.database);


  constructor(private database: AngularFireDatabase, private auth: AngularFireAuth, private router: Router) {
    this.myAuth = getAuth();
  }

  ngOnInit(): void {
  }

  createAccount() {
    document.getElementById('email').classList.remove('is-danger');
    document.getElementById('displayName').classList.remove('is-danger');
    document.getElementById('input-error').style.visibility = 'hidden';
    if (!this.form.displayName || !this.form.email || !this.form.password) return; // TODO: throw an error instead
    // check if display name is taken

    // if taken, throw error

    // else check if email is already in use

    createUserWithEmailAndPassword(this.myAuth, this.form.email, this.form.password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log('user: ' + user);
        console.log('successfully created account');

        updateProfile(user, {
          displayName: this.form.displayName
        }).then(() => {
          console.log('display Name: ' + user.displayName);

          const data = {
            email: this.myAuth.currentUser.email,
            token: '',
            displayName: this.myAuth.currentUser.displayName,
            state: ''
          };

          set(ref(getDatabase(), 'users/' + this.myAuth.currentUser.uid), data).then(() => {
            this._realtimeDatabase.setDatabase('displayNames/', this.myAuth.currentUser.displayName, this.myAuth.currentUser.uid);
            this.router.navigate(['/home']);
          }).catch((e) => {
            console.log(e.message);
            console.log('displayName is taken');
            this.registrationError('displayName', 'Display name is not valid or already in use');
            this.deleteAccount();
          });

        });
      })
      .catch((e) => {
        const errorcode = e.code;
        const errorMessage = e.message;
        this.registrationError('email', 'Email is not valid or already in use');
        console.log(errorMessage);
      });

    // create the account and set the display name
  }

  deleteAccount() {
    deleteUser(this.myAuth.currentUser).then(() => {
      // User deleted.
      console.log('user has been deleted');
    }).catch((error) => {
      // An error ocurred
      console.log(error.message);
    });
  }

  getDisplayName() {
    console.log(this.myAuth.currentUser.displayName);
  }

  registrationError(error: string, message: string) {
    const errorMessage = document.getElementById('input-error');

    errorMessage.style.visibility = 'visible';
    document.getElementById(error).classList.add('is-danger');
    errorMessage.innerText = message;

    if (error === 'email') {
      document.getElementById('email').classList.add('is-danger');
      errorMessage.innerText = 'The email is not valid or already in use';
    } else if (error === 'displayName') {
      document.getElementById('displayName').classList.add('is-danger');
      errorMessage.innerText = 'The display name is not valid or already in use';
    }
  }

}
