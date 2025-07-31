import { Card } from "@/components/ui/card";
import { Quote } from "lucide-react";

const CEOSection = () => {
  return (
    <section id="about" className="py-12 md:py-20 px-6 bg-muted/20">
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Meet Our <span className="text-primary">Founder & CEO</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground">
              Leading SUTI (Sabriy Ultrasound Training Institute) with a vision for excellence in ultrasound education and training.
            </p>
          </div>
          
          <Card className="glass-card p-8 lg:p-12">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="order-2 lg:order-1">
                <Quote className="h-12 w-12 text-primary mb-6" />
                <blockquote className="text-lg leading-relaxed mb-6">
                  "Education is the most powerful tool we can use to change the world. At SUTI, 
                  we're committed to making quality education accessible to everyone, everywhere. 
                  Our mission is to break down barriers and create opportunities for lifelong learning."
                </blockquote>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Prof. Dr. Sabir Ali Butt</h3>
                    <p className="text-primary font-medium mb-1">Chief Executive Officer, SUTI</p>
                    <p className="text-muted-foreground mb-2">Sabiry Surgical Hospital Amin Pur Bangla</p>
                    <ul className="text-muted-foreground text-sm mb-2 list-disc pl-5">
                      <li>M.S. (Diagnostic Ultrasound)</li>
                      <li>Ph.D (Diagnostic Ultrasound)</li>
                      <li>D.M.R.D (Pb)</li>
                      <li>B.B.S (Pb) R.M.P (Pk) M.U.S.P. (Pk) M.A.I.U.M (USA) F.T.I.D.U (Tokyo)</li>
                    </ul>
                    <p className="text-muted-foreground text-sm mb-2">
                      Ex. Assistant Professor, AFRO-ASIAN Institute, Lahore<br/>
                      Ex. Associate Professor, The University of Faisalabad (Radiology)<br/>
                      Associate Professor Radiology, University of Lahore<br/>
                      Member, American Institute of Ultrasound in Medicine<br/>
                      Certified in Advanced Color Doppler Ultrasound Imaging (University of Lahore, UOL)
                    </p>
                    <p className="text-muted-foreground text-sm mb-2">
                      Director, Medical Ultrasound Training Institute (SUTI)<br/>
                      Consultant Radiologist, Consultant Sonologist
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="order-1 lg:order-2">
                <div className="relative">
                  <div className="glass-card p-4 rounded-2xl">
                    <img 
                      src="https://res.cloudinary.com/dcmtpky4i/image/upload/v1751401299/WhatsApp_Image_2025-06-30_at_09.07.46_9dbdb99e_rdbnwq.jpg"
                      alt="CEO Alexandra Rivera"
                      className="rounded-xl w-full"
                    />
                  </div>
                  <div className="absolute -bottom-4 -right-4 glass-card p-4 rounded-xl neon-border">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">500K+</div>
                      <div className="text-sm text-muted-foreground">Lives Impacted</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default CEOSection;
