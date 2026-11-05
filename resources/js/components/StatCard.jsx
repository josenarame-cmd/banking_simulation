import React from 'react';
import { Card, CardContent, Typography, Box, Avatar } from '@mui/material';

export default function StatCard({ title, value, icon, subtitle, color = 'primary' }) {
    return (
        <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
            <CardContent sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
                            {title}
                        </Typography>
                        <Typography variant="h4" fontWeight={800} sx={{ mt: 1, mb: 0.5 }}>
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" color="text.secondary">
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Avatar
                        sx={{
                            bgcolor: `${color}.main`,
                            color: '#ffffff',
                            width: 52,
                            height: 52,
                            boxShadow: (theme) => `0 4px 14px ${theme.palette[color]?.main || '#3b82f6'}40`,
                        }}
                    >
                        {icon}
                    </Avatar>
                </Box>
            </CardContent>
        </Card>
    );
}

