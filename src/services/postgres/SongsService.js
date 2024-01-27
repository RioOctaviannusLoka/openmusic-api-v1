const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class SongsService {
  constructor() {
    this._pool = new Pool();
  }

  async addSong({ title, year, genre, performer, duration, albumId }){
    const id = `song-${nanoid(16)}`;
    const insertQuery = {
      text: 'INSERT INTO songs VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      values: [id, title, year, genre, performer, duration, albumId],
    };

    const result = await this._pool.query(insertQuery);

    if (!result.rows[0].id) {
      throw new InvariantError('Lagu gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getSongs({ title, performer }){
    let query;
    if (title && performer) {
      query = {
        text: 'SELECT * FROM songs WHERE title ILIKE $1 AND performer ILIKE $2',
        values: [title, performer],
      };
    } else if (title) {
      query = {
        text: 'SELECT * FROM songs WHERE title ILIKE $1',
        values: [title],
      };
    } else if (performer) {
      query = {
        text: 'SELECT * FROM songs WHERE performer ILIKE $1',
        values: [performer],
      };
    } else {
      query = {
        text: 'SELECT * FROM songs',
      };
    }

    const result = await this._pool.query(query);
    return result.rows.map((song) => ({
      id: song.id,
      title: song.title,
      performer: song.performer,
    }));
  }

  async getSongById(id) {
    const selectQuery = {
      text: 'SELECT * FROM songs WHERE id=$1',
      values: [id],
    };

    const result = await this._pool.query(selectQuery);

    if(!result.rows.length) {
      throw new NotFoundError('Lagu tidak dapat ditemukan');
    }

    return result.rows[0];
  }

  async editSongById(id, { title, year, genre, performer, duration }) {
    const updateQuery = {
      text: 'UPDATE songs SET title=$1, year=$2, genre=$3, performer=$4, duration=$5 WHERE id=$6 RETURNING id',
      values: [title, year, genre, performer, duration, id],
    };

    const result = await this._pool.query(updateQuery);

    if(!result.rows.length) {
      throw new NotFoundError('Lagu gagal diperbarui. Id tidak dapat ditemukan');
    }
  }

  async deleteSongById(id) {
    const deleteQuery = {
      text: 'DELETE FROM songs WHERE id=$1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(deleteQuery);

    if(!(result).rows.length) {
      throw new NotFoundError('Lagu gagal dihapus. Id tidak dapat ditemukan');
    }
  }
}

module.exports = SongsService;