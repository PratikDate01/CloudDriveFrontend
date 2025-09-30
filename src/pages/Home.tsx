import { useState, useEffect } from 'react';
import { HardDrive, FileText, Folder, Shield, Zap, Users, Globe, Upload, Share2, ArrowRight, CheckCircle, Star, Menu, X, Database, Layers, Eye, Heart, Lock, Play, Search, Image, Video, Music, Twitter, Facebook, Linkedin, Youtube } from 'lucide-react';
import { SignInModal } from '../components/auth/SignInModal';
import { RegisterModal } from '../components/auth/RegisterModal';

export default function DriveHomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [animatedFiles, setAnimatedFiles] = useState<any[]>([]);
  const [activeModal, setActiveModal] = useState<string | null>(null); // 'signin' or 'register'

  // Event listeners for modal switching
  useEffect(() => {
    const handleOpenSignInModal = () => setActiveModal('signin');
    const handleOpenRegisterModal = () => setActiveModal('register');

    window.addEventListener('openSignInModal', handleOpenSignInModal);
    window.addEventListener('openRegisterModal', handleOpenRegisterModal);

    return () => {
      window.removeEventListener('openSignInModal', handleOpenSignInModal);
      window.removeEventListener('openRegisterModal', handleOpenRegisterModal);
    };
  }, []);





  // Animate floating files
  useEffect(() => {
    const fileTypes = [
      { icon: FileText, name: "Report.pdf", size: "2.4 MB", color: "from-red-500 to-red-600" },
      { icon: Image, name: "Design.jpg", size: "5.2 MB", color: "from-purple-500 to-purple-600" },
      { icon: Video, name: "Video.mp4", size: "45.8 MB", color: "from-blue-500 to-blue-600" },
      { icon: Music, name: "Audio.mp3", size: "3.7 MB", color: "from-green-500 to-green-600" }
    ];

    setAnimatedFiles(fileTypes);
  }, []);

  const features = [
    {
      icon: Database,
      title: "AI-Powered Organization",
      description: "Smart categorization automatically sorts your files using machine learning, making everything instantly searchable.",
      color: "from-indigo-500 to-purple-600",
      accent: "indigo"
    },
    {
      icon: Zap,
      title: "Real-Time Sync",
      description: "Changes sync instantly across all devices. Work offline and sync when reconnected seamlessly.",
      color: "from-blue-500 to-cyan-600",
      accent: "blue"
    },
    {
      icon: Shield,
      title: "Military-Grade Security",
      description: "End-to-end encryption, 2FA, and advanced threat detection keep your files absolutely secure.",
      color: "from-emerald-500 to-teal-600",
      accent: "emerald"
    },
    {
      icon: Users,
      title: "Advanced Collaboration",
      description: "Real-time editing, smart permissions, and team workspaces with integrated communication tools.",
      color: "from-orange-500 to-red-600",
      accent: "orange"
    }
  ];

  const fileFeatures = [
    {
      icon: Eye,
      title: "Universal Preview",
      description: "Preview 300+ file formats instantly without downloading. Edit documents, images, and videos online.",
      stats: "300+ formats"
    },
    {
      icon: Search,
      title: "Smart Search",
      description: "Find anything instantly with AI-powered search that understands content inside your files.",
      stats: "99.9% accuracy"
    },
    {
      icon: Layers,
      title: "Version History",
      description: "Track every change with unlimited version history. Restore any file to any point in time.",
      stats: "Unlimited versions"
    },
    {
      icon: Share2,
      title: "Secure Sharing",
      description: "Share files securely with expiring links, password protection, and detailed access controls.",
      stats: "Bank-level security"
    }
  ];

  const integrations = [
    { name: "Google Workspace", logo: "G" },
    { name: "Microsoft 365", logo: "M" },
    { name: "Slack", logo: "S" },
    { name: "Zoom", logo: "Z" },
    { name: "Adobe CC", logo: "A" },
    { name: "Figma", logo: "F" },
    { name: "Notion", logo: "N" },
    { name: "Dropbox", logo: "D" }
  ];



  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Enhanced Background with Particles */}
      <div className="app-background"></div>
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${8 + Math.random() * 4}s`
          }}></div>
        ))}
      </div>

      {/* Main Content Wrapper with Blur Effect */}
      <div className={`transition-all duration-300 relative z-10 ${activeModal ? 'blur-sm pointer-events-none' : ''}`}>
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
                <HardDrive className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">DriveCloud</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              {['Features', 'Security', 'Pricing', 'Enterprise'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-gray-600 hover:text-blue-600 font-medium transition-all duration-200 relative group"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 group-hover:w-full transition-all duration-300"></span>
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => setActiveModal('signin')}
                className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-xl transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => setActiveModal('register')}
                className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold px-6 py-2 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Get Started
              </button>
            </div>

            <button 
              className="md:hidden p-2 text-gray-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-xl">
            <div className="px-4 py-6 space-y-4">
              {['Features', 'Security', 'Pricing', 'Enterprise'].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="block text-gray-600 hover:text-blue-600 font-medium py-2">
                  {item}
                </a>
              ))}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <button
                  onClick={() => setActiveModal('signin')}
                  className="block w-full text-left text-gray-600 font-medium py-2"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setActiveModal('register')}
                  className="block w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold py-3 rounded-xl"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-28 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-40 left-1/2 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-8 border border-blue-100">
                <Star className="w-4 h-4 mr-2 text-yellow-500" />
                Trusted by 50M+ users worldwide
              </div>

              <h1 className="text-5xl lg:text-7xl font-black text-gray-900 leading-tight mb-6">
                Your files.
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                  Everywhere.
                </span>
                <br />
                <span className="text-4xl lg:text-5xl text-gray-700">Instantly.</span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl">
                Store, sync, and share your files with the world's most intelligent cloud storage platform. 
                AI-powered organization meets military-grade security.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button
                  onClick={() => setActiveModal('register')}
                  className="group bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold px-8 py-4 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Start Free - 25GB
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="border-2 border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-700 font-semibold px-8 py-4 rounded-2xl transition-all duration-300 flex items-center justify-center hover:bg-blue-50">
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </button>
              </div>

              <div className="flex items-center justify-center lg:justify-start space-x-8 text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  No credit card required
                </div>
                <div className="flex items-center">
                  <Lock className="w-4 h-4 text-green-500 mr-2" />
                  256-bit encryption
                </div>
                <div className="flex items-center">
                  <Zap className="w-4 h-4 text-green-500 mr-2" />
                  Instant sync
                </div>
              </div>
            </div>

            {/* Interactive File Showcase */}
            <div className="relative lg:ml-12">
              <div className="relative w-full h-[500px]">
                {/* Main File Browser Window */}
                <div className="absolute inset-0 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                  {/* Browser Header */}
                  <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700">My Drive</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Search className="w-4 h-4 text-gray-400" />
                      <Users className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {/* File Grid */}
                  <div className="p-6">
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {/* Folder */}
                      <div className="group bg-blue-50 rounded-xl p-4 hover:bg-blue-100 transition-all duration-300 cursor-pointer transform hover:scale-105">
                        <Folder className="w-8 h-8 text-blue-600 mb-3" />
                        <div className="text-sm font-medium text-gray-900 truncate">Projects</div>
                        <div className="text-xs text-gray-500">24 files</div>
                      </div>

                      {/* Files */}
                      {animatedFiles.slice(0, 5).map((file, index) => (
                        <div key={index} className={`group bg-gradient-to-r ${file.color} rounded-xl p-4 text-white cursor-pointer transform hover:scale-105 transition-all duration-300 hover:shadow-lg`}>
                          <file.icon className="w-8 h-8 mb-3" />
                          <div className="text-sm font-medium truncate">{file.name}</div>
                          <div className="text-xs opacity-80">{file.size}</div>
                        </div>
                      ))}
                    </div>

                    {/* Recent Activity */}
                    <div className="space-y-3">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recent Activity</div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">Presentation.pptx</div>
                            <div className="text-xs text-gray-500">Synced • 2 min ago</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                            <Share2 className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">Design Assets</div>
                            <div className="text-xs text-gray-500">Shared with team • 5 min ago</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Upload Animation */}
                <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 transform rotate-12 hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Uploading...</div>
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full w-3/4 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Core Features */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-6xl font-black text-gray-900 mb-6">
              Intelligent cloud storage
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"> reimagined</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Experience the future of file storage with AI-powered organization, military-grade security, 
              and collaboration tools that adapt to how you work.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {features.map((feature, index) => (
              <div key={index} className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-blue-200 transform hover:-translate-y-2">
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* File Features Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {fileFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-start space-x-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-900">{feature.title}</h3>
                      <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{feature.stats}</span>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Works with your favorite tools
            </h3>
            <p className="text-gray-600">Seamlessly integrate with 100+ popular applications</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
            {integrations.map((integration, index) => (
              <div key={index} className="group bg-gray-50 hover:bg-blue-50 rounded-2xl p-6 transition-all duration-300 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-gray-600 to-gray-700 group-hover:from-blue-600 group-hover:to-indigo-700 rounded-xl flex items-center justify-center text-white font-bold text-lg mb-3 mx-auto transition-all duration-300">
                  {integration.logo}
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors">
                  {integration.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

    

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]"></div>
        </div>
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-6xl font-black text-white mb-6 leading-tight">
            Ready to transform
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
              your workflow?
            </span>
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join millions of users who trust DriveCloud with their most important files.
            Start with 25GB free storage and upgrade as you grow.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <button className="bg-white text-blue-600 hover:bg-gray-50 font-bold px-10 py-4 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center">
              <Upload className="w-5 h-5 mr-2" />
              Start Free Trial
            </button>
            <button className="border-2 border-white text-white hover:bg-white hover:text-blue-600 font-semibold px-10 py-4 rounded-2xl transition-all duration-300">
              Contact Sales
            </button>
          </div>
          
          <div className="flex items-center justify-center space-x-8 text-sm text-blue-200">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              25GB free forever
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              No credit card required
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <HardDrive className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">DriveCloud</span>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                DriveCloud: The world's most intelligent cloud storage platform. Store, sync, and share your files with confidence.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-xl flex items-center justify-center transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-xl flex items-center justify-center transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-xl flex items-center justify-center transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-xl flex items-center justify-center transition-colors">
                  <Youtube className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-lg font-semibold mb-6">Product</h4>
              <div className="space-y-4">
                {['Features', 'Security', 'Integrations', 'API', 'Mobile Apps', 'Desktop Apps'].map((item) => (
                  <a key={item} href="#" className="block text-gray-400 hover:text-white transition-colors">
                    {item}
                  </a>
                ))}
              </div>
            </div>

            {/* Solutions */}
            <div>
              <h4 className="text-lg font-semibold mb-6">Solutions</h4>
              <div className="space-y-4">
                {['Personal', 'Business', 'Enterprise', 'Education', 'Healthcare', 'Government'].map((item) => (
                  <a key={item} href="#" className="block text-gray-400 hover:text-white transition-colors">
                    {item}
                  </a>
                ))}
              </div>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-lg font-semibold mb-6">Support</h4>
              <div className="space-y-4">
                {['Help Center', 'Contact Us', 'Status', 'Privacy Policy', 'Terms of Service', 'GDPR'].map((item) => (
                  <a key={item} href="#" className="block text-gray-400 hover:text-white transition-colors">
                    {item}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-6 mb-4 md:mb-0">
                <p className="text-gray-400">© 2025 DriveCloud. All rights reserved.</p>
                <div className="flex items-center space-x-2 text-gray-400">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span>Made with love globally</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>All systems operational</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4" />
                  <span>Available in 195 countries</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
      </div>

      {/* Modals */}
      <SignInModal isOpen={activeModal === 'signin'} onClose={() => setActiveModal(null)} />
      <RegisterModal isOpen={activeModal === 'register'} onClose={() => setActiveModal(null)} />

      {/* Modal Backdrop */}
      {activeModal && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setActiveModal(null)}
        />
      )}
  </div>
);
}