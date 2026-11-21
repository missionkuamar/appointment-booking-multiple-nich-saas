import express from 'express';
import {
  getWithdrawals,
  getAffiliateDashboard,
  joinAffiliateProgram,
  createAffiliateLink,
  deleteAffiliateLink,
  trackAffiliateConversion,
  getReferrals,
  requestWithdrawal,
} from './affiliate.controllers.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protected affiliate routes (requires logged-in user)
router.use(protect);

router.get('/withdrawals', getWithdrawals);
router.get('/dashboard', getAffiliateDashboard);
router.post('/join', joinAffiliateProgram);
router.post('/links', createAffiliateLink);
router.delete('/links/:id', deleteAffiliateLink);
router.post('/conversion', trackAffiliateConversion);
router.get('/referrals', getReferrals);
router.post('/withdraw', requestWithdrawal);


export default router;