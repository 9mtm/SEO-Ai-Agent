import { useState } from 'react';
import { useUpdateKeywordTags } from '../../services/keywords';
import Icon from '../common/Icon';
import Modal from '../common/Modal';
import AddTags from './AddTags';

type keywordTagManagerProps = {
   keyword: KeywordType | undefined,
   closeModal: Function,
   allTags: string[]
}

const KeywordTagManager = ({ keyword, allTags = [], closeModal }: keywordTagManagerProps) => {
   const [showAddTag, setShowAddTag] = useState<boolean>(false);
   const { mutate: updateMutate } = useUpdateKeywordTags(() => { });

   const removeTag = (tag: String) => {
      if (!keyword) { return; }
      const newTags = keyword.tags.filter((t) => t !== tag.trim());
      updateMutate({ tags: { [keyword.ID]: newTags } });
   };

   return (
      <Modal closeModal={() => { closeModal(false); }} title={`Tags for Keyword "${keyword && keyword.keyword}"`}>
         <div className="text-sm my-6 p-1">
            {keyword && keyword.tags.length > 0 && (
               <div className='flex flex-wrap gap-2'>
                  {keyword.tags.map((tag: string) => {
                     return <span key={tag} className='flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 shadow-sm group hover:border-indigo-200 hover:shadow-md transition-all'>
                        <Icon type="tags" size={12} classes="text-indigo-500" />
                        {tag}
                        <button
                           className="ml-1 p-0.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                           onClick={() => removeTag(tag)}>
                           <Icon type="close" size={10} />
                        </button>
                     </span>;
                  })}
                  <button
                     title='Add New Tag'
                     className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition-colors hover:shadow-sm"
                     onClick={() => setShowAddTag(true)}>
                     <span className="text-sm leading-none">+</span> Add
                  </button>
               </div>
            )}
            {keyword && keyword.tags.length === 0 && (
               <div className='flex flex-col items-center justify-center py-10 px-4 text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200'>
                  <div className='p-3 bg-white rounded-full shadow-sm mb-3 ring-1 ring-gray-100'>
                     <Icon type="tags" size={24} classes="text-indigo-400" />
                  </div>
                  <p className='mb-4 text-sm font-medium text-gray-500'>No Tags Added to this Keyword</p>
                  <button
                     className='px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-indigo-200 hover:shadow-lg flex items-center gap-2'
                     onClick={() => setShowAddTag(true)}
                  >
                     + Add Tag
                  </button>
               </div>
            )}
         </div>
         {showAddTag && keyword && (
            <AddTags
               existingTags={allTags}
               keywords={[keyword]}
               closeModal={() => setShowAddTag(false)}
            />
         )}
      </Modal>
   );
};

export default KeywordTagManager;
