import React from 'react';
import { Chip } from '@mui/material';

export default function StatusBadge({ status }) {
    if (!status) return null;

    const s = String(status).toLowerCase();

    let color = 'default';
    let label = status.replace(/_/g, ' ').toUpperCase();

    switch (s) {
        case 'active':
        case 'completed':
        case 'approved':
        case 'paid':
        case 'success':
            color = 'success';
            break;
        case 'pending':
        case 'requires_approval':
        case 'calculated':
        case 'partially_paid':
            color = 'warning';
            break;
        case 'blocked':
        case 'suspended':
        case 'rejected':
        case 'failed':
        case 'defaulted':
            color = 'error';
            break;
        case 'closed':
        case 'reversed':
        case 'inactive':
        case 'cancelled':
            color = 'default';
            break;
        default:
            color = 'info';
    }

    return (
        <Chip
            size="small"
            label={label}
            color={color}
            sx={{ fontWeight: 600, fontSize: '0.72rem', letterSpacing: '0.03em' }}
        />
    );
}

