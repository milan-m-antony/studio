
import { use } from 'react'; // Ensure 'use' is imported
import HeroSection from '@/components/sections/HeroSection';
import AboutSection from '@/components/sections/AboutSection';
import ProjectsSection from '@/components/sections/ProjectsSection';
import SkillsSection from '@/components/sections/SkillsSection';
import TimelineSection from '@/components/sections/TimelineSection';
import CertificationsSection from '@/components/sections/CertificationsSection';
import ResumeSection from '@/components/sections/ResumeSection';
import ContactSection from '@/components/sections/ContactSection';

export const dynamic = "force-dynamic"; // Ensures the page is dynamically rendered

// Define the expected props for the HomePage component
// Next.js page components receive params and searchParams as objects.
interface HomePageProps {
  params: { [key: string]: string | string[] | undefined };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function HomePage(props: HomePageProps) {
  // Unwrap both params and searchParams using React.use()
  // This must be done before these props are used in any way that
  // assumes they are plain JavaScript objects (like Object.keys, spreading, etc.)
  // Next.js guarantees that params and searchParams are objects, even if empty.
  const resolvedPageParams = use(props.params);
  const resolvedSearchParams = use(props.searchParams);

  // For debugging purposes, you can log them on the server:
  // console.log("Resolved Page Params on server:", resolvedPageParams);
  // console.log("Resolved Search Params on server:", resolvedSearchParams);

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
