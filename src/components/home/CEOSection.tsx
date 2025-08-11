
import { Quote } from "lucide-react";

const CEOSection = () => {
  return (
    <section id="about" className="relative py-20 md:py-32 px-6 bg-gray-900 text-white overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-600 to-transparent opacity-20 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-pink-500 to-transparent opacity-20 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>

      <div className="container mx-auto relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight">
              Meet Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Founder & CEO</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
              Leading SUTI with a vision for excellence in ultrasound education and training worldwide.
            </p>
          </div>
          
          <div className="relative bg-gray-800/40 backdrop-blur-xl border border-gray-700 rounded-3xl shadow-2xl shadow-purple-500/10">
            <div className="p-8 lg:p-12">
              <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-center">
                {/* Image Section */}
                <div className="lg:col-span-2 order-1 lg:order-1">
                  <div className="relative group transform hover:scale-105 transition-transform duration-500">
                    <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                    <img 
                      src="https://res.cloudinary.com/dcmtpky4i/image/upload/v1751401299/WhatsApp_Image_2025-06-30_at_09.07.46_9dbdb99e_rdbnwq.jpg"
                      alt="Prof. Dr. Sabir Ali Butt"
                      className="relative rounded-2xl w-full shadow-lg"
                    />
                    <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md p-4 rounded-xl border border-gray-600">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 animate-pulse">500K+</div>
                        <div className="text-sm text-gray-300 tracking-wider">Lives Impacted</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Text Content Section */}
                <div className="lg:col-span-3 order-2 lg:order-2">
                  <Quote className="h-12 w-12 text-purple-400 mb-6" />
                  <blockquote className="text-xl italic leading-relaxed text-gray-300 mb-6 border-l-4 border-purple-500 pl-6">
                    "Education is the most powerful tool to change the world. At <strong className="font-semibold text-white">Sabiry Ultrasound Training Institute</strong>, we're committed to making quality education accessible to everyone, everywhere."
                  </blockquote>
                  
                  <div>
                    <h3 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-400">Prof. Dr. Sabir Ali Butt</h3>
                    <p className="text-purple-400 font-medium mb-4">Chief Executive Officer, SUTI</p>
                    
                    <div className="text-gray-400 text-sm space-y-3">
                      <p><strong className="text-gray-300">Hospital:</strong> Sabiry Surgical Hospital, Amin Pur Bangla</p>
                      <div>
                        <strong className="text-gray-300">Qualifications:</strong>
                        <ul className="list-disc pl-5 mt-1 grid grid-cols-2 gap-x-4 gap-y-1">
                          <li>M.B.B.S (Pak)</li>
                          <li>M.S.</li>
                          <li>Ph.D</li>
                          <li>D.M.R.D (Pak)</li>
                          <li>R.M.P (Pak)</li>
                          <li>M.U.S.P. (Pak)</li>
                          <li>M.A.I.U.M (USA)</li>
                          <li>F.T.I.D.U (Tokyo)</li>
                        </ul>
                      </div>
                      <p><strong className="text-gray-300">Affiliations:</strong> Member, American Institute of Ultrasound in Medicine</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CEOSection;
