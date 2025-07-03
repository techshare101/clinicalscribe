"use client"

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Menu, ClipboardList, Mic, FileText, ShieldCheck } from "lucide-react";

export default function ClinicalDashboard() {
  const [open, setOpen] = useState(false);
  const toggleSidebar = () => setOpen(!open);

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className={`bg-white shadow-md w-64 p-4 transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <h2 className="text-2xl font-bold text-indigo-600 mb-6">ClinicalScribe</h2>
        <nav className="flex flex-col gap-4">
          <a href="/" className="flex items-center gap-2 text-gray-700 hover:text-indigo-600"><ShieldCheck size={20} /> Dashboard</a>
          <a href="/soap" className="flex items-center gap-2 text-gray-700 hover:text-indigo-600"><ClipboardList size={20} /> SOAP Notes</a>
          <a href="/transcription" className="flex items-center gap-2 text-gray-700 hover:text-indigo-600"><Mic size={20} /> Transcription</a>
          <a href="/test-soap" className="flex items-center gap-2 text-gray-700 hover:text-indigo-600"><FileText size={20} /> Test SOAP</a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" className="md:hidden" onClick={toggleSidebar}><Menu /></Button>
          <div className="flex items-center gap-4">
            <Bell className="text-gray-600" />
            <div className="w-8 h-8 rounded-full bg-gray-400" />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold">Notes</h3>
              <p className="text-3xl font-bold">237</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold">Transcriptions</h3>
              <p className="text-3xl font-bold">178</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold">SOAPs</h3>
              <p className="text-3xl font-bold">63</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h4 className="text-xl font-semibold mb-4">Recent Activity</h4>
          <ul className="space-y-3">
            <li className="text-gray-700">📝 SOAP note created for patient #12345</li>
            <li className="text-gray-700">🎙️ Transcription uploaded by Nurse Ava</li>
            <li className="text-gray-700">✅ System check completed</li>
          </ul>
        </div>
      </main>
    </div>
  );
}