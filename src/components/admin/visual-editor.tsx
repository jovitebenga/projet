'use client';

import { useMemo, useState } from 'react';
import { Puck, type Config } from '@puckeditor/core';
import { ArrowLeft, CloudArrowUp, FloppyDisk, Image as ImageIcon } from '@phosphor-icons/react';
import '@puckeditor/core/puck.css';
import { blockConfig, SiteProvider, type SiteContext } from '../blocks';

function MediaPicker({ value, onChange, media, onUploaded }: { value: string; onChange: (value: string) => void; media: any[]; onUploaded: (media: any) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  async function upload(file?: File) {
    if (!file) return;
    setUploading(true); setError('');
    try {
      const form = new FormData(); form.append('file', file); form.append('alt', file.name);
      const response = await fetch('/api/admin/media', { method: 'POST', body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      onUploaded(result); onChange('/media/' + result.id);
    } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : 'Import impossible.'); }
    finally { setUploading(false); }
  }
  return <div className="visual-media-field">
    {value ? <img src={value} alt="Aperçu du visuel sélectionné" /> : <div className="visual-media-empty"><ImageIcon size={28} /><span>Aucune image sélectionnée</span></div>}
    <label>Sélectionner dans la médiathèque<select value={media.some(item => '/media/' + item.id === value) ? value : ''} onChange={event => onChange(event.target.value)}><option value="">Choisir une image</option>{media.filter(item => item.mime?.startsWith('image/')).map(item => <option key={item.id} value={'/media/' + item.id}>{item.name}</option>)}</select></label>
    <label className="visual-upload-button"><CloudArrowUp size={18} />{uploading ? 'Téléversement…' : 'Téléverser depuis cet appareil'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={event => upload(event.target.files?.[0])} /></label>
    <p className="visual-field-help">Ordinateur, photothèque ou appareil photo du téléphone · 4 Mo maximum.</p>
    {error && <p className="visual-field-error" role="alert">{error}</p>}
  </div>;
}

export default function VisualEditor({ item, context, media: initialMedia, onClose, onSaved }: { item: any; context: SiteContext; media: any[]; onClose: () => void; onSaved: () => void }) {
  const [data, setData] = useState(item.draft.content || { root: { props: {} }, content: [] });
  const [status, setStatus] = useState(''); const [version, setVersion] = useState(item.updated_at); const [media, setMedia] = useState(initialMedia);
  const editorConfig = useMemo<Config>(() => ({ ...blockConfig, components: Object.fromEntries(Object.entries(blockConfig.components).map(([name, component]: any) => { const fields = { ...component.fields }; if (fields.image) fields.image = { type: 'custom', label: 'Image', render: ({ value, onChange }: any) => <MediaPicker value={value || ''} onChange={onChange} media={media} onUploaded={uploaded => setMedia(current => [uploaded, ...current])} /> }; return [name, { ...component, fields }]; })) }), [media]);
  async function save(content: any) { setStatus('Enregistrement…'); const response = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save', content: { ...item, draft: { ...item.draft, content }, expectedUpdatedAt: version } }) }); const result = await response.json(); if (!response.ok) { setStatus(result.error); return; } setVersion(result.updated_at); setStatus('Brouillon enregistré.'); onSaved(); }
  return <div className="visual-editor"><div className="visual-toolbar"><button className="visual-back" onClick={onClose}><ArrowLeft size={17} />Retour au studio</button><div><strong>{item.draft.title}</strong><small>Éditeur visuel · Brouillon</small></div><span role="status">{status}</span><button className="visual-save" onClick={() => save(data)}><FloppyDisk size={17} />Enregistrer</button></div><div className="visual-editor-intro"><strong>Glissez un widget dans la page</strong><span>Sélectionnez un élément pour modifier son contenu, son image et ses réglages.</span></div><SiteProvider data={context}><Puck config={editorConfig} data={data} onChange={setData} onPublish={save} headerTitle="Widgets" headerPath={item.slug === 'accueil' ? '/' : '/' + item.slug} viewports={[{ width: 390, height: 'auto', label: 'Mobile' }, { width: 768, height: 'auto', label: 'Tablette' }, { width: 1440, height: 'auto', label: 'Bureau' }]} height="calc(100dvh - 106px)" /></SiteProvider></div>;
}
