import type { NextApiRequest, NextApiResponse } from 'next';
import { getTransports, getAuthCodes } from '../../../lib/mcp-store';

interface HealthCheckResponse {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    connections: {
        active: number;
        total: number;
    };
    oauth: {
        activeCodes: number;
    };
    memory?: {
        used: number;
        total: number;
        percentage: number;
    };
}

export default function handler(req: NextApiRequest, res: NextApiResponse<HealthCheckResponse>) {
    if (req.method !== 'GET') {
        res.status(405).end();
        return;
    }

    const transports = getTransports();
    const codes = getAuthCodes();

    // Get memory usage
    const memUsage = process.memoryUsage();
    const totalMem = memUsage.heapTotal;
    const usedMem = memUsage.heapUsed;
    const memPercentage = (usedMem / totalMem) * 100;

    // Determine health status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (memPercentage > 90) {
        status = 'unhealthy';
    } else if (memPercentage > 75 || transports.size > 100) {
        status = 'degraded';
    }

    const response: HealthCheckResponse = {
        status,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        connections: {
            active: transports.size,
            total: transports.size
        },
        oauth: {
            activeCodes: codes.size
        },
        memory: {
            used: Math.round(usedMem / 1024 / 1024), // MB
            total: Math.round(totalMem / 1024 / 1024), // MB
            percentage: Math.round(memPercentage)
        }
    };

    // Set appropriate status code
    const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;

    res.status(statusCode).json(response);
}
