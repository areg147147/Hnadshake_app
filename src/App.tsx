import { Navigate, Route, Routes } from 'react-router-dom'

import { Home } from '@/pages/Home'
import { ContractPage } from '@/pages/Contract'
import { SealedPage } from '@/pages/Sealed'

function App() {
  return (
    <main className="min-h-screen">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/contract/:contractId" element={<ContractPage />} />
        <Route path="/sealed/:contractId" element={<SealedPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  )
}

export default App
