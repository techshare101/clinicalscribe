import { NextApiRequest, NextApiResponse } from 'next';
import { runSmokeTest } from '../../scripts/test-firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log("🚀 Running Firebase Admin smoke test via API route...");
    
    // Run the smoke test and capture results
    let results: string[] = [];
    const originalLog = console.log;
    
    // Capture console.log output
    console.log = (...args) => {
      results.push(args.join(' '));
      originalLog.apply(console, args);
    };
    
    // Run the smoke test
    await runSmokeTest();
    
    // Restore console.log
    console.log = originalLog;
    
    // Return results
    res.status(200).json({
      success: true,
      message: "Firebase Admin services are working correctly",
      results: results
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Firebase Admin smoke test failed"
    });
  }
}