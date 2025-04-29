import React from 'react';
import Layout from '../components/layout/Layout';

export default function Agreement() {
  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Kendi Anlaşmamı Ekle</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="max-w-3xl">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Bu özellik yakında kullanıma açılacaktır. Kendi kargo anlaşmanızı sisteme ekleyebileceksiniz.
                  </p>
                </div>
              </div>
            </div>

            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  KARGO FİRMASI
                </label>
                <select
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                >
                  <option>Yurtiçi Kargo</option>
                  <option>MNG Kargo</option>
                  <option>Aras Kargo</option>
                  <option>PTT Kargo</option>
                  <option>UPS</option>
                  <option>Sürat Kargo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  MÜŞTERİ KODU
                </label>
                <input
                  type="text"
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  placeholder="Müşteri kodunuzu girin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  PAROLA
                </label>
                <input
                  type="password"
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  placeholder="Parolanızı girin"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  Anlaşmayı Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}