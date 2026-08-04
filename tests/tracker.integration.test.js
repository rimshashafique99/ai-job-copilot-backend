import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import pool from './../db';
import app from './../app';
import config from '../config';

describe('PATCH /api/tracker/:id', () => {
  let testUserId;
  let testJobApplicationId;
  let token;

  beforeAll(async () => {
    const userResult = await pool.query(
      `INSERT INTO users (email, full_name) VALUES ($1, $2) RETURNING id`,
      ['test@example.com', 'Test User']
    );
    testUserId = userResult.rows[0].id;

    const jobAppResult = await pool.query(
      `INSERT INTO job_applications (user_id, company_name) VALUES ($1, $2) RETURNING id`,
      [testUserId, 'infinix']
    );
    testJobApplicationId = jobAppResult.rows[0].id;

    token = jwt.sign({ userId: testUserId }, config.jwtAccessSecret);
  });

  afterAll(async () => {
    await pool.query(`DELETE FROM job_applications WHERE id = $1`, [testJobApplicationId]);
    await pool.query(`DELETE FROM users WHERE id = $1`, [testUserId]);
  });

  it('updates the job application stage', async () => {
    const res = await request(app)
      .patch(`/api/tracker/${testJobApplicationId}`)
      .set('Cookie', `accessToken=${token}`)
      .send({ stage: 'applied' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.stage).toBe('applied');
  });
});