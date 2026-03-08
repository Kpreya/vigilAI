import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardSidebar from '@/components/layout/DashboardSidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login?callbackUrl=/dashboard');
  }

  return (
    <div className="h-screen overflow-hidden flex bg-paper-bg">
      <DashboardSidebar user={session.user} />
      <main className="flex-1 h-full overflow-y-auto bg-[#fafafa] paper-grid relative">
        {children}
      </main>
    </div>
  );
}
