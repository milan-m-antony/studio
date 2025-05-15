
import SectionWrapper from '@/components/ui/SectionWrapper';
import SectionTitle from '@/components/ui/SectionTitle';
import ContactForm from '@/components/ContactForm';
import { Mail, Phone, MapPin, Linkedin, Github, Twitter, Instagram, Facebook } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

export default function ContactSection() {
  const contactDetails = [
    {
      icon: MapPin,
      label: "Address",
      value: "123 Creative Lane, Tech City, TC 54321",
      href: "#",
      isLink: false,
    },
    {
      icon: Phone,
      label: "Phone",
      value: "+1 (555) 123-4567",
      href: "tel:+15551234567",
      isLink: true,
    },
    {
      icon: Mail,
      label: "Email",
      value: "milan@example.com",
      href: "mailto:milan@example.com",
      isLink: true,
    },
  ];

  const socialLinks = [
     {
      icon: Linkedin,
      label: "LinkedIn",
      href: "https://linkedin.com/in/yourusername",
      text: "linkedin.com/in/yourusername"
    },
    {
      icon: Github,
      label: "GitHub",
      href: "https://github.com/yourusername",
      text: "github.com/yourusername"
    },
    {
      icon: Twitter, 
      label: "X (Twitter)",
      href: "https://x.com/yourusername",
      text: "x.com/yourusername"
    },
    {
      icon: Instagram,
      label: "Instagram",
      href: "https://instagram.com/yourusername",
      text: "instagram.com/yourusername"
    },
    {
      icon: Facebook,
      label: "Facebook",
      href: "https://facebook.com/yourusername",
      text: "facebook.com/yourusername"
    },
  ];


  return (
    <SectionWrapper id="contact" className="bg-background section-fade-in" style={{ animationDelay: '1.4s' }}>
      <SectionTitle subtitle="Have a project in mind, a question, or just want to say hi? Feel free to reach out. I'm always open to discussing new opportunities.">
        Get In Touch
      </SectionTitle>
      <Card className="max-w-5xl mx-auto shadow-xl">
        <CardContent className="p-0 md:p-0 grid md:grid-cols-2 items-stretch"> {/* Removed padding, items-stretch */}
          
          {/* Left Column: Contact Info & Social Links */}
          <div className="space-y-8 p-6 md:p-8 bg-card rounded-l-lg h-full flex flex-col"> {/* Added h-full and flex flex-col */}
            <div>
              <h3 className="text-2xl font-semibold text-foreground mb-6">Contact Information</h3>
              {contactDetails.map((item, index) => (
                <div key={index} className="flex items-start gap-4 mb-4 last:mb-0">
                  <item.icon className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    {item.isLink ? (
                      <Link href={item.href} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[hsl(var(--primary-hover))] transition-colors break-all">
                        {item.value}
                      </Link>
                    ) : (
                      <p className="text-muted-foreground break-all">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-auto pt-8"> {/* Changed mt-8 to mt-auto and added pt-8 */}
              <h3 className="text-xl font-semibold text-foreground mb-6">Connect With Me</h3>
              <div className="space-y-4">
                {socialLinks.map((social, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <social.icon className="h-5 w-5 text-primary flex-shrink-0" />
                    <Link href={social.href} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[hsl(var(--primary-hover))] transition-colors text-sm break-all">
                      {social.text}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="space-y-6 p-6 md:p-8 bg-background md:bg-card rounded-r-lg h-full flex flex-col"> {/* Added md:bg-card, h-full, flex flex-col */}
            <h3 className="text-2xl font-semibold text-foreground mb-0 text-center md:text-left">Send Me a Message</h3> {/* mb-0 */}
            <div className="flex-grow"> {/* Added flex-grow to push button down */}
              <ContactForm />
            </div>
          </div>

        </CardContent>
      </Card>
    </SectionWrapper>
  );
}

