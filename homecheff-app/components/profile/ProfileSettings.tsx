'use client';

import { useState, useEffect } from 'react';
import { User, MapPin, Calendar, Edit3, Save, X } from 'lucide-react';

interface ProfileSettingsProps {
  user: {
    id: string;
    name: string;
    username: string;
    bio?: string;
    place?: string;
    gender?: string;
    interests?: string[];
    image?: string;
  };
  onSave: (data: any) => Promise<void>;
}

export default function ProfileSettings({ user, onSave }: ProfileSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    username: user.username || '',
    bio: user.bio || '',
    place: user.place || '',
    gender: user.gender || '',
    interests: user.interests || []
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      username: user.username || '',
      bio: user.bio || '',
      place: user.place || '',
      gender: user.gender || '',
      interests: user.interests || []
    });
    setIsEditing(false);
  };

  const addInterest = (interest: string) => {
    if (interest.trim() && !formData.interests.includes(interest.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, interest.trim()]
      }));
    }
  };

  const removeInterest = (index: number) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <User className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Profielinstellingen</h2>
            <p className="text-sm text-gray-500">Beheer je persoonlijke informatie</p>
          </div>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            <span>Bewerken</span>
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleCancel}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Annuleren</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Opslaan...' : 'Opslaan'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Volledige naam
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gebruikersnaam
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            disabled={!isEditing}
            rows={3}
            placeholder="Vertel iets over jezelf..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Locatie
          </label>
          <input
            type="text"
            value={formData.place}
            onChange={(e) => setFormData(prev => ({ ...prev, place: e.target.value }))}
            disabled={!isEditing}
            placeholder="Bijv. Amsterdam, Nederland"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Geslacht
          </label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
            disabled={!isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="">Niet opgegeven</option>
            <option value="MALE">Man</option>
            <option value="FEMALE">Vrouw</option>
            <option value="OTHER">Anders</option>
          </select>
        </div>

        {/* Interests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Interesses
          </label>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {formData.interests.map((interest, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm"
                >
                  {interest}
                  {isEditing && (
                    <button
                      onClick={() => removeInterest(index)}
                      className="ml-2 text-emerald-600 hover:text-emerald-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {isEditing && (
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Voeg interesse toe..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addInterest(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    addInterest(input.value);
                    input.value = '';
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Toevoegen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

