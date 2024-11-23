import React from 'react';

const FormattedSummary = ({ text }) => {
  const formatText = (text) => {
    // Split the text into sections by double newlines
    return text.split('\n\n').map((section, index) => {
      let formattedSection = section;
      
      // Bold text (between **)
      formattedSection = formattedSection.replace(
        /\*\*(.*?)\*\*/g,
        '<span class="font-bold">$1</span>'
      );
      
      // Italic text (between ***)
      formattedSection = formattedSection.replace(
        /\*\*\*(.*?)\*\*\*/g,
        '<span class="italic">$1</span>'
      );
      
      // Superscript (between <sup></sup>)
      formattedSection = formattedSection.replace(
        /<sup>(.*?)<\/sup>/g,
        '<sup class="text-xs relative -top-1">$1</sup>'
      );
      
      // Subscript (between <sub></sub>)
      formattedSection = formattedSection.replace(
        /<sub>(.*?)<\/sub>/g,
        '<sub class="text-xs relative -bottom-1">$1</sub>'
      );
      
      return (
        <p
          key={index}
          className="mb-4 last:mb-0"
          dangerouslySetInnerHTML={{ __html: formattedSection }}
        />
      );
    });
  };

  return (
    <div className="prose max-w-none">
      {formatText(text)}
    </div>
  );
};

export default FormattedSummary