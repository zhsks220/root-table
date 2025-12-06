import { Music, Award, Users, Shield } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-20">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Music className="h-20 w-20 text-white" />
          </div>
          <h1 className="text-6xl font-bold text-white mb-6">
            Premium Music Distribution
          </h1>
          <p className="text-2xl text-blue-200 mb-12 max-w-3xl mx-auto">
            고품질 음원을 안전하고 효율적으로 배포하는 전문 솔루션
          </p>
        </div>
      </header>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Feature 1 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center hover:bg-white/20 transition">
            <Award className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3">Premium Quality</h3>
            <p className="text-blue-100">
              최고 품질의 음원을 손실 없이 전달합니다
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center hover:bg-white/20 transition">
            <Shield className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3">Secure Distribution</h3>
            <p className="text-blue-100">
              초대 기반 보안 시스템으로 안전하게 배포
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center hover:bg-white/20 transition">
            <Users className="h-16 w-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3">Easy Management</h3>
            <p className="text-blue-100">
              직관적인 관리 시스템으로 쉽게 운영
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-12">
          <h2 className="text-4xl font-bold text-white mb-6 text-center">
            Our Mission
          </h2>
          <p className="text-xl text-blue-100 leading-relaxed text-center mb-8">
            음악 산업의 디지털 전환을 선도하며, 아티스트와 레이블이
            자신들의 음원을 안전하고 효율적으로 배포할 수 있도록 돕습니다.
          </p>
          <p className="text-lg text-blue-200 text-center">
            우리는 기술과 음악의 완벽한 조화를 추구합니다.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6">
            <div className="text-5xl font-bold text-white mb-2">1000+</div>
            <div className="text-blue-200">Active Tracks</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6">
            <div className="text-5xl font-bold text-white mb-2">99.9%</div>
            <div className="text-blue-200">Uptime</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6">
            <div className="text-5xl font-bold text-white mb-2">24/7</div>
            <div className="text-blue-200">Support</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 text-center">
        <div className="border-t border-white/20 pt-8">
          <p className="text-blue-200">
            © 2024 Premium Music Distribution. All rights reserved.
          </p>
          <p className="text-blue-300 text-sm mt-2">
            Professional Music Distribution Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
