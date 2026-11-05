import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Divider,
    Paper,
    Grid
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import VerifiedIcon from '@mui/icons-material/Verified';
import StatusBadge from './StatusBadge';

export default function ReceiptModal({ open, onClose, transaction }) {
    if (!transaction) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" fontWeight={700}>Official Transaction Receipt</Typography>
                <StatusBadge status={transaction.status} />
            </DialogTitle>
            <DialogContent dividers>
                <Paper
                    variant="outlined"
                    sx={{
                        p: 3,
                        borderRadius: 3,
                        background: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc'
                    }}
                >
                    <Box textAlign="center" mb={2}>
                        <Typography variant="overline" color="text.secondary" letterSpacing={1.5}>
                            FINTECH CORE BANKING SIMULATION
                        </Typography>
                        <Typography variant="h4" fontWeight={800} color="primary" sx={{ my: 1 }}>
                            ${Number(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Reference: <strong style={{ fontFamily: 'monospace' }}>{transaction.reference}</strong>
                        </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Transaction Type</Typography>
                            <Typography variant="body2" fontWeight={600} textTransform="capitalize">
                                {transaction.transaction_type?.replace(/_/g, ' ')}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Execution Timestamp</Typography>
                            <Typography variant="body2" fontWeight={600}>
                                {new Date(transaction.created_at).toLocaleString()}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">From Account</Typography>
                            <Typography variant="body2" fontWeight={600}>
                                {transaction.from_account?.account_number || transaction.from_account_id || 'Cash / External'}
                            </Typography>
                            {transaction.from_account?.user && (
                                <Typography variant="caption" color="text.secondary">
                                    {transaction.from_account.user.name}
                                </Typography>
                            )}
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">To Account</Typography>
                            <Typography variant="body2" fontWeight={600}>
                                {transaction.to_account?.account_number || transaction.to_account_id || 'Cash / External'}
                            </Typography>
                            {transaction.to_account?.user && (
                                <Typography variant="caption" color="text.secondary">
                                    {transaction.to_account.user.name}
                                </Typography>
                            )}
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">Description / Remarks</Typography>
                            <Typography variant="body2">
                                {transaction.description || 'No description provided.'}
                            </Typography>
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    <Box display="flex" alignItems="center" justifyContent="center" gap={1} color="success.main">
                        <VerifiedIcon fontSize="small" />
                        <Typography variant="caption" fontWeight={600}>
                            Double-Entry Ledger Verified & Reconciled
                        </Typography>
                    </Box>
                </Paper>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={handlePrint} startIcon={<PrintIcon />} variant="outlined">
                    Print Receipt
                </Button>
                <Button onClick={onClose} variant="contained">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}

