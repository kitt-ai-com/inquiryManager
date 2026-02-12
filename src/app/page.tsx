import { ConsultationTable } from "@/components/consultations/consultation-table";
import { Header } from "@/components/header";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto px-6 py-6" style={{ maxWidth: "1500px" }}>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">상담 내역</h2>
          <p className="text-sm text-muted-foreground">
            CS 상담 내역을 조회하고 관리합니다.
          </p>
        </div>

        <ConsultationTable />
      </main>
    </div>
  );
}
