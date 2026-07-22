'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BudgetsPageRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/chat');
  }, [router]);

  return null;
}
