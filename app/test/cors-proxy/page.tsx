// app/test/cors-proxy/page.tsx
"use client";

import React from 'react'
import TestCorsProxy from '@/components/test-cors-proxy'

export default function CorsProxyTestPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">CORS Proxy Test Page</h1>
      <p className="mb-6 text-gray-600">
        This page demonstrates how the CORS proxy solves the cross-origin request issues
        when calling the Omnidimension API.
      </p>
      <TestCorsProxy />
    </div>
  )
}
