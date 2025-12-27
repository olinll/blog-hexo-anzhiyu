'use strict';

hexo.extend.filter.register('after_render:html', function(str, data){
  var content = str;
  
  content = content.replace(/src\s*=\s*["']assets\//g, 'src="/assets/');
  content = content.replace(/data-lazy-src\s*=\s*["']assets\//g, 'data-lazy-src="/assets/');
  content = content.replace(/data-src\s*=\s*["']assets\//g, 'data-src="/assets/');
  content = content.replace(/href\s*=\s*["']assets\//g, 'href="/assets/');
  
  return content;
});

hexo.extend.filter.register('before_exit', function(){
  var fs = require('fs');
  var path = require('path');
  
  var args = process.argv.slice(2);
  var isCleanCommand = args.includes('clean');
  
  if (isCleanCommand) {
    console.log('move-assets.js: Skipping asset copy for clean command');
    return;
  }
  
  var sourcePosts = path.join(hexo.source_dir, '_posts');
  var targetAssets = path.join(hexo.public_dir, 'assets');
  
  console.log('move-assets.js: Checking for assets folders in:', sourcePosts);
  
  var copyRecursive = function(src, dest) {
    var exists = fs.existsSync(src);
    var stats = exists && fs.statSync(src);
    var isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      fs.readdirSync(src).forEach(function(childItemName) {
        copyRecursive(path.join(src, childItemName), path.join(dest, childItemName));
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  };
  
  var findAndCopyAssets = function(dir, relativePath) {
    if (!fs.existsSync(dir)) {
      return;
    }
    
    var items = fs.readdirSync(dir);
    items.forEach(function(item) {
      var itemPath = path.join(dir, item);
      var stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        if (item === 'assets') {
          var destPath = targetAssets;
          console.log('move-assets.js: Found assets folder at:', itemPath, 'moving to:', destPath);
          copyRecursive(itemPath, destPath);
        } else {
          findAndCopyAssets(itemPath, path.join(relativePath, item));
        }
      }
    });
  };
  
  findAndCopyAssets(sourcePosts, '');
  console.log('move-assets.js: Assets moved successfully');
  
  var updateImagePaths = function(dir) {
    if (!fs.existsSync(dir)) {
      return;
    }
    
    var items = fs.readdirSync(dir);
    items.forEach(function(item) {
      var itemPath = path.join(dir, item);
      var stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        updateImagePaths(itemPath);
      } else if (path.extname(item) === '.html') {
        var content = fs.readFileSync(itemPath, 'utf8');
        var originalContent = content;
        
        content = content.replace(/src\s*=\s*["']assets\//g, 'src="/assets/');
        content = content.replace(/data-lazy-src\s*=\s*["']assets\//g, 'data-lazy-src="/assets/');
        content = content.replace(/data-src\s*=\s*["']assets\//g, 'data-src="/assets/');
        content = content.replace(/href\s*=\s*["']assets\//g, 'href="/assets/');
        
        if (content !== originalContent) {
          fs.writeFileSync(itemPath, content, 'utf8');
          console.log('move-assets.js: Updated image paths in:', itemPath);
        }
      }
    });
  };
  
  console.log('move-assets.js: Updating image paths in HTML files...');
  updateImagePaths(hexo.public_dir);
  console.log('move-assets.js: Image paths updated successfully');
});