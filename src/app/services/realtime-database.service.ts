import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { getDatabase, ref, set, onValue, child, get, push, update, remove, Database } from 'firebase/database';

@Injectable({
  providedIn: 'root'
})
export class RealtimeDatabaseService {
  private db: Database;

  constructor(private database: AngularFireDatabase) {
    this.db = getDatabase();
  }

  setDatabase() {
    set(ref(this.db, 'test/' + 0), {
      username: 'joe',
      refresh_token: '123'
    });
  }

  readDatabase() {
    const testCountRef = ref(this.db, 'test/' + 0);
    onValue(testCountRef, (snapshot) => {
      const data = snapshot.val();
      console.log(data);
    });
  }

  updateDatabase() {
    const newToken = {
      username: 'joe',
      refresh_token: '321'
    }

    const newKey = push(child(ref(this.db), 'test')).key;
    console.log(newKey);

    const updates = {};
    updates['test/' + 0] = newToken;

    return update(ref(this.db), updates);
  }

  deleteDatabase() {
    remove(ref(this.db, 'test/' + 0));
  }

}
