class FoldersController < ApplicationController
    def create
        folder = Folder.create(
            :name => params[:name]
        )
        folder.save
        render :json => get_folder_info(folder).to_json
    end
end
