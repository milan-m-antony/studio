
"use client";

import SectionWrapper from '@/components/ui/SectionWrapper';
import SectionTitle from '@/components/ui/SectionTitle';
import { Button } from '@/components/ui/button';
import { Download, Printer, Briefcase, GraduationCap, ListChecks, Languages as LanguagesIcon, Building, Cloud, Laptop, Server as ServerIcon, Shield, Globe } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ResumeDetailItemProps {
  title: string;
  subtitle?: string;
  date?: string;
  description?: string | string[];
  icon?: React.ElementType;
}

const ResumeDetailItem: React.FC<ResumeDetailItemProps> = ({ title, subtitle, date, description, icon: Icon }) => (
  <div className="mb-6">
    <div className="flex items-center mb-2">
      {Icon && <Icon className="h-6 w-6 mr-3 text-primary" />}
      <div>
        <h4 className="text-xl font-semibold text-foreground">{title}</h4>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
    {date && <p className="text-xs text-muted-foreground mb-2 ml-9">{date}</p>}
    {description && (
      <div className="ml-9 text-sm text-foreground/80">
        {Array.isArray(description) ? (
          <ul className="list-disc list-inside space-y-1">
            {description.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        ) : (
          <p>{description}</p>
        )}
      </div>
    )}
  </div>
);


const experienceData = [
  {
    title: "Network Support Engineer",
    company: "SMEC LABS, Kochi, India",
    date: "Currently Training",
    details: [
      "Gaining hands-on experience in network support and troubleshooting.",
      "Learning about network configuration and maintenance.",
      "Assisting senior engineers with client network issues.",
    ],
    icon: Building,
  }
];

const educationData = [
  {
    degree: "Diploma in Network Engineering",
    institution: "SMEC, Kaloor, Kochi",
    date: "June – Dec 2024",
    description: "Focused on networking concepts and technologies.",
    icon: GraduationCap,
  },
  {
    degree: "BCA (Bachelor of Computer Applications)",
    institution: "B.V.M. Holy Cross College, Cherpunkal",
    date: "2021 – 2024",
    description: "Comprehensive study in computer applications and software development.",
    icon: GraduationCap,
  },
  {
    degree: "Higher Secondary (Computer Science)",
    institution: "St. Thomas HSS, Erumely",
    date: "2019 – 2021",
    description: "Focused on Computer Science stream.",
    icon: Laptop,
  },
  {
    degree: "High School",
    institution: "St. Mary’s HS, Umikuppa",
    date: "2018 – 2019",
    description: "",
    icon: GraduationCap,
  },
];

const keySkillsData = [
  {
    category: "Networking",
    icon: ServerIcon,
    skills: ["Routing", "DHCP", "NAT", "VLAN", "VPN", "ACL", "VTP", "SNMP", "Network Troubleshooting", "Configuration"],
  },
  {
    category: "Cloud (Azure)",
    icon: Cloud,
    skills: ["Virtual Machines", "Storage Accounts", "Entra ID (formerly Azure AD)", "Resource Management"],
  },
  {
    category: "Windows Server/Tools",
    icon: ServerIcon, 
    skills: ["ADDS", "IIS", "DHCP", "FTP", "RRAS", "NAT", "Hyper-V", "Server Backup", "Troubleshooting"],
  },
  {
    category: "Windows Client OS",
    icon: Shield, 
    skills: ["Installation & Configuration", "KMSPico Activation", "BitLocker", "Defender Security"],
  }
];

const languagesData = [
  { name: "English", proficiency: "Professional Working Proficiency", icon: Globe },
  { name: "Malayalam", proficiency: "Full Professional Proficiency", icon: Globe },
];


export default function ResumeSection() {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <SectionWrapper id="resume" className="section-fade-in" style={{ animationDelay: '1.2s' }}>
      <SectionTitle subtitle="Access my comprehensive resume for a detailed overview of my qualifications and experience.">
        My Resume / CV
      </SectionTitle>
      <div className="text-center space-y-6 max-w-md mx-auto mb-12">
        <p className="text-muted-foreground">
          Download the latest version of my resume to learn more about my skills, experience, and accomplishments.
          You can also print a copy directly.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <a href="/resume-milan.pdf" download="Milan_Resume.pdf">
              <Download className="mr-2 h-5 w-5" /> Download PDF
            </a>
          </Button>
          <Button variant="outline" size="lg" onClick={handlePrint} className="w-full sm:w-auto">
            <Printer className="mr-2 h-5 w-5" /> Print Resume
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          (Note: Download links to a placeholder PDF. Print functionality uses browser print.)
        </p>
      </div>

      <Tabs defaultValue="experience" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
          <TabsTrigger value="experience"><Briefcase className="mr-2 h-4 w-4 inline-block" />Experience</TabsTrigger>
          <TabsTrigger value="education"><GraduationCap className="mr-2 h-4 w-4 inline-block" />Education</TabsTrigger>
          <TabsTrigger value="skills"><ListChecks className="mr-2 h-4 w-4 inline-block" />Key Skills</TabsTrigger>
          <TabsTrigger value="languages"><LanguagesIcon className="mr-2 h-4 w-4 inline-block" />Languages</TabsTrigger>
        </TabsList>

        <TabsContent value="experience">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center"><Briefcase className="mr-3 h-6 w-6 text-primary" /> Professional Experience</CardTitle>
            </CardHeader>
            <CardContent>
              {experienceData.map((exp, index) => (
                <ResumeDetailItem
                  key={index}
                  title={exp.title}
                  subtitle={exp.company}
                  date={exp.date}
                  description={exp.details}
                  icon={exp.icon}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="education">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center"><GraduationCap className="mr-3 h-6 w-6 text-primary" /> Education</CardTitle>
            </CardHeader>
            <CardContent>
              {educationData.map((edu, index) => (
                 <ResumeDetailItem
                  key={index}
                  title={edu.degree}
                  subtitle={edu.institution}
                  date={edu.date}
                  description={edu.description}
                  icon={edu.icon}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center"><ListChecks className="mr-3 h-6 w-6 text-primary" /> Key Skills</CardTitle>
            </CardHeader>
            <CardContent>
              {keySkillsData.map((skillCategory, index) => (
                <div key={index} className="mb-8"> {/* Increased bottom margin */}
                  <div className="flex items-center mb-3">
                    {skillCategory.icon && <skillCategory.icon className="h-5 w-5 mr-2 text-primary" />} {/* Adjusted icon size and margin */}
                    <h4 className="text-lg font-semibold text-foreground">{skillCategory.category}</h4> {/* Adjusted title size */}
                  </div>
                  <div className="pl-7 flex flex-wrap gap-3"> {/* Aligned badges with title and increased gap */}
                    {skillCategory.skills.map((skill, skillIndex) => (
                      <Badge key={skillIndex} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="languages">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center"><LanguagesIcon className="mr-3 h-6 w-6 text-primary" /> Languages</CardTitle>
            </CardHeader>
            <CardContent>
              {languagesData.map((lang, index) => (
                <ResumeDetailItem
                  key={index}
                  title={lang.name}
                  description={lang.proficiency}
                  icon={lang.icon}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </SectionWrapper>
  );
}

