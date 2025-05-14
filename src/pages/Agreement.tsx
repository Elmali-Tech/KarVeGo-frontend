import React from 'react';
import Layout from '../components/layout/Layout';
import { AlertTriangle } from 'lucide-react';

export default function Agreement() {
  return (
    <Layout>
      <div className="space-y-6 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 border-b border-gray-200 pb-4">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Kendi Anlaşmamı Ekle</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border border-gray-100">
          <div className="max-w-3xl">
            <div className="bg-lightGreen bg-opacity-10 border-l-4 border-darkGreen p-4 mb-6 rounded-r-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-darkGreen" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-700">
                    Bu özellik yakında kullanıma açılacaktır. Kendi kargo anlaşmanızı sisteme ekleyebileceksiniz.
                  </p>
                </div>
              </div>
            </div>

            <form className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  KARGO FİRMASI
                </label>
                <select
                  disabled
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-lightGreen focus:ring-lightGreen sm:text-sm"
                >
                  <option>Yurtiçi Kargo</option>
                  <option>MNG Kargo</option>
                  <option>Aras Kargo</option>
                  <option>PTT Kargo</option>
                  <option>UPS</option>
                  <option>Sürat Kargo</option>
                </select>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  MÜŞTERİ KODU
                </label>
                <input
                  type="text"
                  disabled
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-lightGreen focus:ring-lightGreen sm:text-sm"
                  placeholder="Müşteri kodunuzu girin"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PAROLA
                </label>
                <input
                  type="password"
                  disabled
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-lightGreen focus:ring-lightGreen sm:text-sm"
                  placeholder="Parolanızı girin"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-darkGreen hover:bg-lightGreen focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lightGreen disabled:opacity-50 transition-colors"
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