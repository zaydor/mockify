import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SpotifyApiService } from '../services/spotify-api.service';

@Component({
  selector: 'app-playlist-info-dialog',
  templateUrl: './playlist-info-dialog.component.html',
  styleUrls: ['./playlist-info-dialog.component.css']
})
export class PlaylistInfoDialogComponent implements OnInit {
  playlistInfo: {
    collaborative: boolean,
    description: string,
    id: string,
    name: string,
    tracksURL: string,
    image: any,
    tracksTotal: number
  };

  songsInfo: {
    artistNames?: string,
    albumName: string,
    songName: string,
    songId: string,
    albumId: string,
    uri: string
  }[];

  finishedLoading: boolean = false;

  public access_token: string;

  @Output()
  songPlaying = new EventEmitter();

  /*

  ------------------------ PLAYLIST INFO DIALOG FUNCTIONS ------------------------

  */

  constructor(public dialogRef: MatDialogRef<PlaylistInfoDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any, private spotifyApiService: SpotifyApiService) {
    this.playlistInfo = this.data[0];
    this.access_token = this.data[1];

    console.log(this.playlistInfo);

    this.songsInfo = [];
    this.getTracks();
  }

  ngOnInit(): void {

  }

  formatArtistsNames(artistNames): string {
    let string = '';
    const artistsArr = artistNames;
    const len = artistsArr.length;
    for (let i = 0; i < len; i++) {
      if ((i + 1 === len)) {
        string += `${artistsArr[i]}`;
      } else {
        string += `${artistsArr[i]}, `;
      }
    }

    return string;
  }

  getTrackNumber(index) {
    return index + 1;
  }

  closeDialog() {
    this.dialogRef.close();
  }

  /*

  ------------------------ END PLAYLIST INFO DIALOG FUNCTIONS ------------------------

  */

  /*

  ------------------------ SPOTIFY API CALLS ------------------------

  */

  async playSongsFromPlaylist(index) {
    const uris = [];

    for (let i = index; i < this.playlistInfo.tracksTotal; i++) {
      uris.push(this.songsInfo[i].uri);
    }

    await this.spotifyApiService.playSongsFromPlaylist(this.access_token, uris);

    this.songPlaying.emit();
  }

  async getTracks(offset?) {
    if (!offset) offset = 0;

    const data = await this.spotifyApiService.getTracks(this.access_token, this.playlistInfo.tracksURL, offset);

    for (let i = 0; i < 100; i++) {
      if (!data.items[i]) break;

      const song = data.items[i].track;

      const artists = [];
      for (let j = 0; j < song.artists.length; j++) {
        artists.push(song.artists[j].name);
      }

      this.songsInfo.push({
        songId: song.id,
        albumName: song.album.name,
        albumId: song.album.id,
        artistNames: this.formatArtistsNames(artists),
        songName: song.name,
        uri: song.uri
      });

    }

    if (!offset) offset = 0;

    const newOffset = 100 + offset;
    console.log(newOffset);
    console.log(data.total);
    if (newOffset < data.total) {
      this.getTracks(newOffset);
    }

    this.finishedLoading = true;

  }

  /*

  ------------------------ END SPOTIFY API CALLS ------------------------

  */

}
