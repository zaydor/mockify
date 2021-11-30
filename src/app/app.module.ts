import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { ProfileComponent } from './profile/profile.component';
import { SpotifyAuthorizationComponent } from './spotify-authorization/spotify-authorization.component';
import { CookieService } from 'ngx-cookie-service';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';
import { environment } from '../environments/environment';
import { RealtimeDatabaseService } from './services/realtime-database.service';
import { FormsModule } from '@angular/forms';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { RegisterComponent } from './register/register.component';
import { PlaylistInfoDialogComponent } from './playlist-info-dialog/playlist-info-dialog.component';
import { PlayerComponent } from './player/player.component';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PlaylistBoxComponent } from './playlist-box/playlist-box.component';
import { PlayerService } from './player.service';
import { MatMenuModule } from '@angular/material/menu';
import { SortingMenuComponent } from './sorting-menu/sorting-menu.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent,
    ProfileComponent,
    SpotifyAuthorizationComponent,
    ForgotPasswordComponent,
    RegisterComponent,
    PlaylistInfoDialogComponent,
    PlayerComponent,
    PlaylistBoxComponent,
    SortingMenuComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireDatabaseModule,
    AngularFireAuthModule,
    FormsModule,
    BrowserAnimationsModule,
    MatDialogModule,
    AngularFireModule,
    MatIconModule,
    MatPaginatorModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatMenuModule
  ],
  providers: [CookieService, RealtimeDatabaseService, PlayerService],
  bootstrap: [AppComponent]
})
export class AppModule { }
