// Global app controller
import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';


import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';

import {elements, renderLoader, clearLoader } from './views/base';
import { parseFloat } from 'core-js/fn/number';
    
// Global state of the app
// - search object
// - current object
// - shopping list object
// - liked recipes

const state = {};


// Search controller
const controlSearch = async () =>{
    // 1 get query from the view
    const query = searchView.getInput();
    console.log(query)

    if (query){
        // 2. new search object and add to state
        state.search = new Search(query);

        // 3. prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try{
        // 4. search for recipes
        await state.search.getResults();

        // 5. render results on UI
        clearLoader();
        searchView.renderResults(state.search.result);
        }catch(error){
            alert('something went wrong');
            clearLoader();
        }
        
    }
}

elements.searchForm.addEventListener('submit', e =>{
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if (btn){
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
     }
});

// Recipe controller

const controlRecipe  = async () => {

    // get ID from URL
    const id = window.location.hash.replace('#', '');

    if (id){
        // prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        // highlight selected search item

        if (state.search) searchView.highlightSelected(id);

        // create new Reicpe object
        state.recipe = new Recipe(id);

       try{
        // get recipe data and parse ingredients
        await state.recipe.getRecipe();
        state.recipe.parseIngredients();

        // calculate servings and time
        state.recipe.calcTime();
        state.recipe.calcServings();

        // render recipe
        clearLoader();
        recipeView.renderRecipe(
            state.recipe,
            state.likes.isLiked(id)
            );

       }catch(error){
           alert('error processing')
       }
    }

};

['hashchange','load'].forEach(event => window.addEventListener(event, controlRecipe));

// List Controller

const controlList = () => {
    // create a new list if there is none yet
    if (!state.list) state.list = new List();

    // add each ingredient into the list
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);

        listView.renderItem(item);
    });
};

// handle delete and update list item events

elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    // handle the delete event
    if ( e.target.matches('.shopping__delete, .shopping__delete *')){
        // Delete from State
            state.list.deleteItem(id);
        // Delete from UI
        listView.deleteItem(id);
    
    //handle count update
    }else if (e.target.matches('.shopping__count-value')){
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});

// Like controller

const controlLike = () => {
     if (!state.likes) state.likes = new Likes();

     const currentID = state.recipe.id;
     // user has not yet liked current recipe
     if (!state.likes.isLiked(currentID)){
         // add like to the state
         const newLike = state.likes.addLike(
             currentID,
             state.recipe.title,
             state.recipe.author,
             state.recipe.img
         );

         // toggle the like button
         likesView.toggleLikeBtn(true);

         // add like from UI list
         likesView.renderLike(newLike);
 
     // user has not yet liked current recipe
     } else {
         // remove like to the state
         state.likes.deleteLike(currentID);

         // toggle the like button
         likesView.toggleLikeBtn(false);

         // remove like from UI list
         likesView.deleteLike(currentID);
 
     }
     likesView.toggleLikeMenue(state.likes.getNumLikes());
};

// restore likedrecipies on page load
window.addEventListener('load', ()=> {
    
    state.likes = new Likes();

    // restore Likes
    state.likes.readStorage();

    //toggle like menu button
    likesView.toggleLikeMenue(state.likes.getNumLikes());

    // render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
});

// handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        // Decrease button is clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        // Increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')){
        // add ingredients to shopping list
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')){
        // like controller
        controlLike();
    }
})

