import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

@Injectable()
export class ProxyService {
	private ticketsProxy = createProxyMiddleware({
		target: process.env.TICKETS_MS_URL || 'http://localhost:3001',
		changeOrigin: true,
		pathRewrite: {
			'^/api/tickets': '/tickets',
		},
		on: {
			proxyReq: (proxyReq, req: Request) => {
				// Forward all cookies from original request
				if (req.headers.cookie) {
					proxyReq.setHeader('Cookie', req.headers.cookie);
				}
			},
			proxyRes: (proxyRes) => {
				// Allow CORS from frontend
				proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
			},
		},
	});

	private videoCallProxy = createProxyMiddleware({
		target: process.env.VIDEO_CALL_MS_URL || 'http://localhost:3002',
		changeOrigin: true,
		pathRewrite: {
			'^/api/video-call': '',
		},
		ws: true, // Enable WebSocket proxying
		on: {
			proxyReq: (proxyReq, req: Request) => {
				// Forward all cookies from original request
				if (req.headers.cookie) {
					proxyReq.setHeader('Cookie', req.headers.cookie);
				}
			},
			proxyRes: (proxyRes) => {
				// Allow CORS from frontend
				proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
			},
		},
	});

	proxyTicketsRequest(req: Request, res: Response) {
		return this.ticketsProxy(req, res, () => {});
	}

	proxyVideoCallRequest(req: Request, res: Response) {
		return this.videoCallProxy(req, res, () => {});
	}
}
