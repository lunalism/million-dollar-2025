"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/main/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getContent } from "@/lib/api";
import { Content, FAQItem } from "@/lib/types";

export default function Contact() {
  const pathname = usePathname();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [content, setContent] = useState<Content | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      const data: Content = await getContent();
      setContent(data);
    };
    loadContent();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", { name, email, message });
    setName("");
    setEmail("");
    setMessage("");
  };

  if (!content) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header activePath={pathname} />
      <section className="flex-1 flex items-center justify-center py-8">
        <div className="max-w-7xl w-full px-4 flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Your Name
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder=""
                  className="mt-1 border-t-0 border-l-0 border-r-0 border-b-2 border-gray-300 focus:ring-0 focus:border-blue-500 rounded-none"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Your Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=""
                  className="mt-1 border-t-0 border-l-0 border-r-0 border-b-2 border-gray-300 focus:ring-0 focus:border-blue-500 rounded-none"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  Share your thoughts
                </label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder=""
                  className="mt-1 h-50 border-t-0 border-l-0 border-r-0 border-b-2 border-gray-300 focus:ring-0 focus:border-blue-500 rounded-none"
                  rows={4}
                />
              </div>
              <div>
                <Button
                  type="submit"
                  className="w-full bg-white text-gray-900 border-2 border-blue-500 hover:bg-blue-50 hover:border-blue-600 rounded-lg py-3 font-semibold shadow-md"
                >
                  SHARE YOUR FEEDBACK
                </Button>
              </div>
            </form>
          </div>

          <div className="flex-1">
            <h2 className="text-5xl font-bold text-gray-900 mb-2">
              Contact <span className="text-blue-500">Us</span>
            </h2>
            <div className="w-16 h-1 bg-blue-500 mb-6"></div>
            <p className="text-gray-600 mb-8">
              It is very important for us to keep in touch with you, so we are always ready to answer any question that interests you. Shoot!
            </p>

            <h3 className="text-2xl font-semibold text-gray-800 mb-4">
              Frequently Asked Questions
            </h3>
            <Accordion type="single" collapsible className="w-full">
              {content.faq.map((item: FAQItem, index: number) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    </div>
  );
}