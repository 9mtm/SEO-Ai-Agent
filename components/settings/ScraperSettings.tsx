import React from 'react';
import { useClearFailedQueue } from '../../services/settings';
import Icon from '../common/Icon';
import SelectField, { SelectionOption } from '../common/SelectField';
import SecretField from '../common/SecretField';
import ToggleField from '../common/ToggleField';
import { useLanguage } from '../../context/LanguageContext';

type ScraperSettingsProps = {
   settings: SettingsType,
   settingsError: null | {
      type: string,
      msg: string
   },
   updateSettings: Function,
}

const ScraperSettings = ({ settings, settingsError, updateSettings }:ScraperSettingsProps) => {
   const { t } = useLanguage();
   const { mutate: clearFailedMutate, isPending: clearingQueue } = useClearFailedQueue(() => {});

   const scrapingOptions: SelectionOption[] = [
      { label: t('scraperSettings.freqDaily'), value: 'daily' },
      { label: t('scraperSettings.freqOtherDay'), value: 'other_day' },
      { label: t('scraperSettings.freqWeekly'), value: 'weekly' },
      { label: t('scraperSettings.freqMonthly'), value: 'monthly' },
      { label: t('scraperSettings.freqNever'), value: 'never' },
   ];
   const delayOptions: SelectionOption[] = [
      { label: t('scraperSettings.delayNone'), value: '0' },
      { label: t('scraperSettings.delaySeconds', { count: 5 }), value: '5000' },
      { label: t('scraperSettings.delaySeconds', { count: 10 }), value: '10000' },
      { label: t('scraperSettings.delaySeconds', { count: 30 }), value: '30000' },
      { label: t('scraperSettings.delayMinutes', { count: 1 }), value: '60000' },
      { label: t('scraperSettings.delayMinutes', { count: 2 }), value: '120000' },
      { label: t('scraperSettings.delayMinutes', { count: 5 }), value: '300000' },
      { label: t('scraperSettings.delayMinutes', { count: 10 }), value: '600000' },
      { label: t('scraperSettings.delayMinutes', { count: 15 }), value: '900000' },
      { label: t('scraperSettings.delayMinutes', { count: 30 }), value: '1800000' },
   ];
   const allScrapers: SelectionOption[] = settings.available_scapers ? settings.available_scapers : [];
   const scraperOptions: SelectionOption[] = [{ label: t('scraperSettings.scraperNone'), value: 'none' }, ...allScrapers];
   const labelStyle = 'mb-2 font-semibold inline-block text-sm text-gray-700 capitalize';

   return (
      <div>
      <div className='settings__content styled-scrollbar p-6 text-sm'>

         <div className="settings__section__select mb-5">
            <SelectField
            label={t('scraperSettings.method')}
            options={scraperOptions}
            selected={[settings.scraper_type || 'none']}
            defaultLabel={t('scraperSettings.selectScraper')}
            updateField={(updatedTime:[string]) => updateSettings('scraper_type', updatedTime[0])}
            multiple={false}
            rounded={'rounded'}
            minWidth={220}
            />
         </div>
         {settings.scraper_type !== 'none' && settings.scraper_type !== 'proxy' && (
            <div className="settings__section__secret mb-5">
               <SecretField
               label={t('scraperSettings.apiKeyLabel')}
               placeholder={t('scraperSettings.apiKeyPlaceholder')}
               value={settings?.scaping_api || ''}
               hasError={settingsError?.type === 'no_api_key'}
               onChange={(value:string) => updateSettings('scaping_api', value)}
               />
            </div>
         )}
         {settings.scraper_type === 'proxy' && (
            <div className="settings__section__input mb-5">
               <label className={labelStyle}>{t('scraperSettings.proxyList')}</label>
               <textarea
                  className={`w-full p-2 border border-gray-200 rounded mb-3 text-xs 
                  focus:outline-none min-h-[160px] focus:border-blue-200 
                  ${settingsError?.type === 'no_email' ? ' border-red-400 focus:border-red-400' : ''} `}
                  value={settings?.proxy}
                  placeholder={'http://122.123.22.45:5049\nhttps://user:password@122.123.22.45:5049'}
                  onChange={(event) => updateSettings('proxy', event.target.value)}
               />
            </div>
         )}
         {settings.scraper_type !== 'none' && (
            <div className="settings__section__input mb-5">
               <SelectField
                  label={t('scraperSettings.frequency')}
                  multiple={false}
                  selected={[settings?.scrape_interval || 'daily']}
                  options={scrapingOptions}
                  defaultLabel={t('notificationSettings.settingsLabel')}
                  updateField={(updated:string[]) => updated[0] && updateSettings('scrape_interval', updated[0])}
                  rounded='rounded'
                  maxHeight={48}
                  minWidth={220}
               />
               <small className=' text-gray-500 pt-2 block'>{t('scraperSettings.restartNote')}</small>
            </div>
         )}
            <div className="settings__section__input mb-5">
               <SelectField
                  label={t('scraperSettings.scrapeDelay')}
                  multiple={false}
                  selected={[settings?.scrape_delay || '0']}
                  options={delayOptions}
                  defaultLabel={t('scraperSettings.delaySettings')}
                  updateField={(updated:string[]) => updated[0] && updateSettings('scrape_delay', updated[0])}
                  rounded='rounded'
                  maxHeight={48}
                  minWidth={220}
               />
               <small className=' text-gray-500 pt-2 block'>{t('scraperSettings.restartNote')}</small>
            </div>
            <div className="settings__section__input mb-5">
               <ToggleField
               label={t('scraperSettings.autoRetry')}
               value={!!settings?.scrape_retry }
               onChange={(val) => updateSettings('scrape_retry', val)}
               />
            </div>
            {settings?.scrape_retry && (settings.failed_queue?.length || 0) > 0 && (
               <div className="settings__section__input mb-5">
                  <label className={labelStyle}>{t('scraperSettings.clearFailed')}</label>
                  <button
                  onClick={() => clearFailedMutate()}
                  className=' py-3 px-5 w-full rounded cursor-pointer bg-gray-100 text-gray-800
                  font-semibold text-sm hover:bg-gray-200'>
                     {clearingQueue && <Icon type="loading" size={14} />} {t('scraperSettings.clearFailedBtn')}
                       {' '}{t('scraperSettings.keywordsCount', { count: settings.failed_queue?.length || 0 })}
                  </button>
               </div>
            )}
      </div>
   </div>
   );
};

export default ScraperSettings;
