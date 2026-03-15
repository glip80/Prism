import { http, HttpResponse } from 'msw';

const API_URL = '/api/v1';

export const handlers = [
  // Auth
  http.post(`${API_URL}/auth/login`, () => {
    return HttpResponse.json({
      token: 'mock-jwt-token',
      user: { id: '1', email: 'test@example.com', first_name: 'Test', last_name: 'User', roles: ['admin'] },
    });
  }),

  http.get(`${API_URL}/auth/me`, () => {
    return HttpResponse.json({
      id: '1', email: 'test@example.com', first_name: 'Test', last_name: 'User', roles: ['admin'],
    });
  }),

  // Layouts
  http.get(`${API_URL}/layouts`, () => {
    return HttpResponse.json([
      { id: 'layout-1', title: 'Default Dashboard', version: 1, widgets: [] },
    ]);
  }),

  http.get(`${API_URL}/layouts/:id`, ({ params }) => {
    return HttpResponse.json({
      id: params.id, title: 'Test Layout', version: 1, widgets: [],
    });
  }),

  // Widgets
  http.post(`${API_URL}/widgets/:widgetId/data`, () => {
    return HttpResponse.json({ data: [{ value: 42, label: 'Mock' }] });
  }),
];
