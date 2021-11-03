import { Content } from '@angular/compiler/src/render3/r3_ast';
import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

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

  constructor(public dialogRef: MatDialogRef<PlaylistInfoDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
    this.playlistInfo = this.data[0];
    this.access_token = this.data[1];

    console.log(this.playlistInfo);

    this.songsInfo = [];
    this.getTracks();
  }

  ngOnInit(): void {

  }

  async playSongsFromPlaylist(index) {
    const uris = [];

    for (let i = index; i < this.playlistInfo.tracksTotal; i++) {
      uris.push(this.songsInfo[i].uri);
    }

    const result = await fetch('https://api.spotify.com/v1/me/player/play', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.access_token,
      },
      body: JSON.stringify({ uris: uris })
    });

    // await this.getCurrentSongName();

    this.songPlaying.emit();
  }

  async getTracks(offset?) {
    const result = await fetch(`${this.playlistInfo.tracksURL}?` + new URLSearchParams({
      limit: '100',
      offset: (offset) ? offset : '0' // if offset exists, put in an offset, otherwise make it 0
    }), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.access_token
      }
    });

    const data = await result.json();
    console.log(data);

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

}
