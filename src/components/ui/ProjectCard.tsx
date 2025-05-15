
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, Github, Rocket, Wrench, FlaskConical, CheckCircle2, Archive, ClipboardList, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { Project, ProjectStatus } from '@/types/supabase'; 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


interface ProjectCardProps {
  project: Project;
}

const statusConfig: Record<ProjectStatus, { icon: LucideIcon; label: string; badgeVariant: "default" | "secondary" | "destructive" | "outline" }> = {
  'Deployed': { icon: Rocket, label: 'Deployed', badgeVariant: 'default' },
  'Completed': { icon: CheckCircle2, label: 'Completed', badgeVariant: 'default' },
  'In Progress': { icon: Wrench, label: 'In Progress', badgeVariant: 'secondary' },
  'Prototype': { icon: FlaskConical, label: 'Prototype', badgeVariant: 'secondary' },
  'Archived': { icon: Archive, label: 'Archived', badgeVariant: 'outline' },
  'Concept': { icon: ClipboardList, label: 'Concept', badgeVariant: 'outline' },
};


export default function ProjectCard({ project }: ProjectCardProps) {
  const currentStatusConfig = project.status ? statusConfig[project.status] : statusConfig['Concept']; 
  const isActionable = project.status === 'Deployed' || project.status === 'Completed';

  let liveDemoButton = null;
  if (project.liveDemoUrl) {
    if (isActionable) {
      liveDemoButton = (
        <Button asChild variant="outline" className="flex-1 group/button hover:border-primary min-w-0">
          <Link href={project.liveDemoUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4 group-hover/button:text-primary transition-colors" />
            <span className="group-hover/button:text-primary transition-colors">Live Demo</span>
          </Link>
        </Button>
      );
    } else {
      liveDemoButton = (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" className="flex-1 min-w-0" disabled>
                <ExternalLink className="mr-2 h-4 w-4" /> Live Demo
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Demo for project under development or not available.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
  } else {
    liveDemoButton = (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" className="flex-1 min-w-0" disabled>
              <ExternalLink className="mr-2 h-4 w-4" /> Live Demo
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Live demo not available.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  let sourceCodeButton = null;
  if (project.repoUrl) {
     sourceCodeButton = ( 
        <Button asChild variant="outline" className="flex-1 group/button hover:border-primary min-w-0" disabled={!isActionable}>
          <Link href={isActionable && project.repoUrl ? project.repoUrl : '#'} target={isActionable && project.repoUrl ? "_blank" : undefined} rel={isActionable && project.repoUrl ? "noopener noreferrer" : undefined} aria-disabled={!isActionable}>
            <Github className="mr-2 h-4 w-4 group-hover/button:text-primary transition-colors" />
            <span className="group-hover/button:text-primary transition-colors">Source Code</span>
          </Link>
        </Button>
      );
      if (!isActionable) {
        sourceCodeButton = (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="flex-1 min-w-0" disabled>
                    <Github className="mr-2 h-4 w-4" /> Source Code
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                 <p>Source code may be private or project under development.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
  } else {
    sourceCodeButton = (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" className="flex-1 min-w-0" disabled>
              <Github className="mr-2 h-4 w-4" /> Source Code
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Source code not available.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }


  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg bg-card transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 hover:scale-[1.015]">
      <div className="relative w-full h-48 md:h-56 group">
        <Image
          src={project.imageUrl || `https://placehold.co/600x400.png`}
          alt={project.title || 'Project image'}
          layout="fill"
          objectFit="cover"
          className="transition-transform duration-300 group-hover:scale-105"
          data-ai-hint={project.title || 'project abstract'}
        />
      </div>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-semibold">{project.title}</CardTitle>
          {currentStatusConfig && (
            <Badge variant={currentStatusConfig.badgeVariant} className="ml-2 shrink-0">
              <currentStatusConfig.icon className="mr-1.5 h-3.5 w-3.5" />
              {currentStatusConfig.label}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <p className="text-sm text-muted-foreground mb-3 flex-grow">{project.description}</p>
        
        {project.status === 'In Progress' && project.progress !== null && project.progress !== undefined && (
          <div className="my-3">
            <Progress value={project.progress} className="h-2" aria-label={`${project.progress}% complete`} />
            <p className="text-xs text-muted-foreground mt-1 text-right">{project.progress}% complete</p>
          </div>
        )}
        {project.status === 'Concept' && (
          <p className="text-xs text-muted-foreground my-3 italic">Concept Phase - Coming Soon!</p>
        )}
         {project.status === 'Prototype' && (
          <p className="text-xs text-muted-foreground my-3 italic">Currently a Prototype</p>
        )}


        {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
            {project.tags.map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
            </div>
        )}
      </CardContent>
      <CardFooter className="mt-auto pt-0">
        <div className="flex gap-2 w-full">
          {liveDemoButton}
          {sourceCodeButton}
        </div>
      </CardFooter>
    </Card>
  );
}
