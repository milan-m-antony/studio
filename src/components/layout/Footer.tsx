// src/components/layout/Footer.tsx
"use client";
import { FileText, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

type ModalContentType = 'terms' | 'privacy' | null;

export default function Footer() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [openModal, setOpenModal] = useState<ModalContentType>(null);
  const [lastUpdatedDate, setLastUpdatedDate] = useState('');

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    setLastUpdatedDate(new Date().toLocaleDateString());
  }, []);

  const handleOpenModal = (type: ModalContentType) => {
    setOpenModal(type);
  };

  const handleCloseModal = () => {
    setOpenModal(null);
  };

  const termsContent = (
    <>
      <p className="mb-4">Welcome to Milan's Portfolio! These terms and conditions outline the rules and regulations for the use of Milan's Portfolio Website, located at yourdomain.com.</p>
      <p className="mb-2">By accessing this website we assume you accept these terms and conditions. Do not continue to use Milan's Portfolio if you do not agree to take all of the terms and conditions stated on this page.</p>
      <h3 className="text-lg font-semibold mt-4 mb-2">Cookies</h3>
      <p className="mb-2">We employ the use of cookies. By accessing Milan's Portfolio, you agreed to use cookies in agreement with the Milan's Portfolio's Privacy Policy.</p>
      <h3 className="text-lg font-semibold mt-4 mb-2">License</h3>
      <p className="mb-2">Unless otherwise stated, Milan and/or its licensors own the intellectual property rights for all material on Milan's Portfolio. All intellectual property rights are reserved. You may access this from Milan's Portfolio for your own personal use subjected to restrictions set in these terms and conditions.</p>
      <p className="mb-2">You must not:</p>
      <ul className="list-disc list-inside mb-2 pl-4">
        <li>Republish material from Milan's Portfolio</li>
        <li>Sell, rent or sub-license material from Milan's Portfolio</li>
        <li>Reproduce, duplicate or copy material from Milan's Portfolio</li>
        <li>Redistribute content from Milan's Portfolio</li>
      </ul>
      <p className="mb-4">This Agreement shall begin on the date hereof.</p>
      <h3 className="text-lg font-semibold mt-4 mb-2">Disclaimer</h3>
      <p>To the maximum extent permitted by applicable law, we exclude all representations, warranties and conditions relating to our website and the use of this website. Nothing in this disclaimer will limit or exclude our or your liability for death or personal injury; limit or exclude our or your liability for fraud or fraudulent misrepresentation; limit any of our or your liabilities in any way that is not permitted under applicable law; or exclude any of our or your liabilities that may not be excluded under applicable law.</p>
      {lastUpdatedDate && <p className="mt-6 text-sm text-muted-foreground">Last updated: {lastUpdatedDate}</p>}
    </>
  );

  const privacyPolicyContent = (
    <>
      <p className="mb-4">Your privacy is important to us. It is Milan's Portfolio's policy to respect your privacy regarding any information we may collect from you across our website, yourdomain.com, and other sites we own and operate.</p>
      <p className="mb-2">We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.</p>
      <p className="mb-2">We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.</p>
      <p className="mb-2">We don’t share any personally identifying information publicly or with third-parties, except when required to by law.</p>
      <p className="mb-4">Our website may link to external sites that are not operated by us. Please be aware that we have no control over the content and practices of these sites, and cannot accept responsibility or liability for their respective privacy policies.</p>
      <p className="mb-2">You are free to refuse our request for your personal information, with the understanding that we may be unable to provide you with some of your desired services.</p>
      <p className="mb-4">Your continued use of our website will be regarded as acceptance of our practices around privacy and personal information. If you have any questions about how we handle user data and personal information, feel free to contact us.</p>
      {lastUpdatedDate && <p className="mt-6 text-sm text-muted-foreground">Last updated: {lastUpdatedDate}</p>}
    </>
  );

  return (
    <>
      <footer className="border-t border-border/40 bg-background">
        <div className="container mx-auto flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center">
            <p className="text-sm leading-loose text-muted-foreground">
              &copy; {currentYear} Milan. All rights reserved.
            </p>
            <span className="hidden sm:inline-block text-muted-foreground mx-1">|</span>
            <Button
              variant="link"
              className="text-sm text-muted-foreground hover:text-foreground p-0 h-auto"
              onClick={() => handleOpenModal('terms')}
            >
              Terms & Conditions
            </Button>
            <span className="hidden sm:inline-block text-muted-foreground mx-1">·</span>
            <Button
              variant="link"
              className="text-sm text-muted-foreground hover:text-foreground p-0 h-auto"
              onClick={() => handleOpenModal('privacy')}
            >
              Privacy Policy
            </Button>
          </div>
        </div>
      </footer>

      <Dialog open={openModal !== null} onOpenChange={(isOpen) => !isOpen && handleCloseModal()}>
        <DialogContent className="max-w-2xl sm:max-w-3xl md:max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl">
              {openModal === 'terms' && <FileText className="mr-2 h-6 w-6 text-primary" />}
              {openModal === 'privacy' && <ShieldCheck className="mr-2 h-6 w-6 text-primary" />}
              {openModal === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
            </DialogTitle>
            <DialogDescription>
              {openModal === 'terms' ? "Please read these terms carefully." : "Your privacy is important to us."}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-6">
            <div className="prose dark:prose-invert max-w-none text-sm text-foreground/80 py-4">
              {openModal === 'terms' && termsContent}
              {openModal === 'privacy' && privacyPolicyContent}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
