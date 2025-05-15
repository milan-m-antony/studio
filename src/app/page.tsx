
import HeroSection from '@/components/sections/HeroSection';
import AboutSection from '@/components/sections/AboutSection';
import ProjectsSection from '@/components/sections/ProjectsSection';
import SkillsSection from '@/components/sections/SkillsSection';
import TimelineSection from '@/components/sections/TimelineSection';
import CertificationsSection from '@/components/sections/CertificationsSection';
import ResumeSection from '@/components/sections/ResumeSection';
import ContactSection from '@/components/sections/ContactSection';

export const dynamic = "force-dynamic"; // Ensures the page is dynamically rendered on every request

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <ProjectsSection />
      <SkillsSection />
      <TimelineSection />
      <CertificationsSection />
      <ResumeSection />
      <ContactSection />
    </>
  );
}
