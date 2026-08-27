import { Request, Response } from 'express';
import {
  askAiFraudAssistant,
  analyzeSuspiciousTextMessage,
  transcribeAndExtractFraudReport
} from '../services/aiFraudAssistant';

/**
 * Interactive Conversational AI Fraud Defense Specialist
 */
export async function chatWithAiAssistant(req: Request, res: Response) {
  try {
    const { prompt, history } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Prompt message is required.'
      });
    }

    const response = await askAiFraudAssistant(prompt.trim(), Array.isArray(history) ? history : []);

    return res.json({
      success: true,
      data: response
    });
  } catch (err: any) {
    console.error('AI chat error:', err);
    return res.status(500).json({
      success: false,
      message: err?.message || 'Failed to process AI assistant request.'
    });
  }
}

/**
 * Deep Analysis of Suspicious SMS / WhatsApp message / Offer text
 */
export async function analyzeSuspiciousMessage(req: Request, res: Response) {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Suspicious text content is required for analysis.'
      });
    }

    const analysis = await analyzeSuspiciousTextMessage(text.trim());

    return res.json({
      success: true,
      analysis
    });
  } catch (err: any) {
    console.error('AI message analysis error:', err);
    return res.status(500).json({
      success: false,
      message: err?.message || 'Failed to analyze suspicious message.'
    });
  }
}

/**
 * Transcribe User Voice Recording & Extract Fraud Report Fields
 */
export async function transcribeScamVoice(req: Request, res: Response) {
  try {
    const { audioBase64, mimeType, clientTranscript, language } = req.body;

    if (!audioBase64 && !clientTranscript) {
      return res.status(400).json({
        success: false,
        message: 'Audio data or client speech transcript is required.'
      });
    }

    const result = await transcribeAndExtractFraudReport({
      audioBase64: typeof audioBase64 === 'string' ? audioBase64 : undefined,
      mimeType: typeof mimeType === 'string' ? mimeType : 'audio/webm',
      clientTranscript: typeof clientTranscript === 'string' ? clientTranscript : undefined,
      language: typeof language === 'string' ? language : 'auto'
    });

    return res.json({
      success: true,
      data: result
    });
  } catch (err: any) {
    console.error('Voice transcription error:', err);
    return res.status(500).json({
      success: false,
      message: err?.message || 'Failed to transcribe and analyze voice recording.'
    });
  }
}
