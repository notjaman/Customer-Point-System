
import { GoogleGenAI, Type } from "@google/genai";
import { Customer } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateMarketingMessage = async (customer: Customer): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a highly engaging, personalized SMS marketing message for a customer named ${customer.name} who has ${customer.points} points in our loyalty program. The tone should be premium and rewarding. Suggest they use their points for a special 20% discount or a free gift. Keep it under 160 characters.`,
    });
    return response.text || "Special offer just for you! Visit us today and use your points.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Thank you for being a loyal customer! Check out our new rewards today.";
  }
};

export const getCustomerInsights = async (customers: Customer[]): Promise<string> => {
  try {
    const data = customers.map(c => ({ name: c.name, points: c.points }));
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this customer data and provide a one-paragraph summary of the overall loyalty trends and one specific recommendation to increase engagement: ${JSON.stringify(data)}`,
    });
    return response.text || "Your customers are showing steady engagement. Consider a weekend points multiplier to boost traffic.";
  } catch (error) {
    return "Data analysis currently unavailable. Keep rewarding your top spenders!";
  }
};
