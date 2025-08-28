import TranscriptionPageServer from "./page-server";

export default function TranscriptionPage() {
  return <TranscriptionPageServer />;
}

// Add this to prevent prerendering issues
export const dynamic = "force-dynamic";